package com.eduai.backend_java.services;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Executes student code in a temp directory against a sample stdin input.
 * Dev-grade sandbox: per-run temp dir, hard timeout, no network setup.
 * Supported languages: python, cpp (g++), java (javac/java).
 */
@Service
public class CodeExecutionService {

    public record RunResult(String stdout, String stderr, boolean timedOut, String error) {}

    private static final long RUN_TIMEOUT_SECONDS = 10;
    private static final long COMPILE_TIMEOUT_SECONDS = 30;

    /**
     * Reads a child process' (merged) output concurrently with its execution.
     * Without this, a program producing more output than the OS pipe buffer
     * (a few KB on Windows) blocks forever writing to a pipe nobody drains yet,
     * so the process never exits and the run times out — large outputs such as
     * sorting a 2500-element array would otherwise always be graded as failed.
     */
    private static String readAllAsync(InputStream stream) {
        try {
            return CompletableFuture.supplyAsync(() -> readAll(stream))
                    .get(60, TimeUnit.SECONDS);
        } catch (Exception e) {
            return "";
        }
    }

    private static String readAll(InputStream stream) {
        try (InputStream in = stream) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }

    public RunResult run(String language, String code, String stdinInput) {
        if (code == null || code.isBlank()) {
            return new RunResult("", "No code provided.", false, "EMPTY_CODE");
        }
        Path dir = null;
        try {
            dir = Files.createTempDirectory("eduai_run_");
            List<String> command = switch (language) {
                case "python" -> preparePython(dir, code);
                case "cpp" -> prepareCpp(dir, code);
                case "java" -> prepareJava(dir, code);
                default -> null;
            };
            if (command == null) {
                return new RunResult("", "", false, "Unsupported language: " + language);
            }
            if (command.isEmpty()) {
                // prepare* already returned a compile-failure marker via exception path;
                // this should not happen, but guard anyway.
                return new RunResult("", "", false, "COMPILE_ERROR");
            }
            return execute(command, dir, stdinInput);
        } catch (CompileFailed cf) {
            return new RunResult("", cf.getMessage(), false, "COMPILE_ERROR");
        } catch (Exception e) {
            return new RunResult("", String.valueOf(e.getMessage()), false, "EXEC_ERROR");
        } finally {
            if (dir != null) cleanup(dir);
        }
    }

    private List<String> preparePython(Path dir, String code) throws IOException {
        Path file = dir.resolve("main.py");
        Files.writeString(file, code, StandardCharsets.UTF_8);
        return List.of("python", file.toAbsolutePath().toString());
    }

    private List<String> prepareCpp(Path dir, String code) throws IOException, InterruptedException {
        Path src = dir.resolve("main.cpp");
        Files.writeString(src, code, StandardCharsets.UTF_8);
        Path exe = dir.resolve("main.exe");
        Process compile = new ProcessBuilder(
                "g++", src.toAbsolutePath().toString(), "-o", exe.toAbsolutePath().toString(), "-std=c++17")
                .redirectErrorStream(true)
                .start();
        String output = readAllAsync(compile.getInputStream());
        boolean done = compile.waitFor(COMPILE_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        if (!done) {
            compile.destroyForcibly();
            throw new CompileFailed("Compilation timed out.");
        }
        if (compile.exitValue() != 0) {
            throw new CompileFailed(output.isBlank() ? "Compilation failed." : output);
        }
        return List.of(exe.toAbsolutePath().toString());
    }

    private List<String> prepareJava(Path dir, String code) throws IOException, InterruptedException {
        Path src = dir.resolve("Main.java");
        Files.writeString(src, code, StandardCharsets.UTF_8);
        Process compile = new ProcessBuilder("javac", src.toAbsolutePath().toString())
                .redirectErrorStream(true)
                .start();
        String output = readAllAsync(compile.getInputStream());
        boolean done = compile.waitFor(COMPILE_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        if (!done) {
            compile.destroyForcibly();
            throw new CompileFailed("Compilation timed out.");
        }
        if (compile.exitValue() != 0) {
            throw new CompileFailed(output.isBlank() ? "Compilation failed." : output);
        }
        return List.of("java", "-cp", dir.toAbsolutePath().toString(), "Main");
    }

    private RunResult execute(List<String> command, Path dir, String stdinInput)
            throws IOException, InterruptedException {
        Process p = new ProcessBuilder(command)
                .directory(dir.toFile())
                .redirectErrorStream(true)
                .start();
        AtomicReference<String> mergedRef = new AtomicReference<>("");
        Thread drainer = new Thread(() -> mergedRef.set(readAll(p.getInputStream())));
        drainer.setDaemon(true);
        drainer.start();
        Thread writer = new Thread(() -> {
            try (OutputStream os = p.getOutputStream()) {
                if (stdinInput != null && !stdinInput.isEmpty()) {
                    os.write(stdinInput.getBytes(StandardCharsets.UTF_8));
                }
            } catch (IOException ignored) {
                // child may print and exit before we finish writing stdin
            }
        });
        writer.setDaemon(true);
        writer.start();
        boolean finished = p.waitFor(RUN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        if (!finished) {
            p.descendants().forEach(ProcessHandle::destroyForcibly);
            p.destroyForcibly();
            return new RunResult("", "", true, "TIME_LIMIT_EXCEEDED");
        }
        String merged = mergedRef.get();
        int exit = p.exitValue();
        if (exit != 0) {
            return new RunResult(merged.stripTrailing(), "", false,
                    "RUNTIME_ERROR (exit code " + exit + ")");
        }
        return new RunResult(merged, "", false, null);
    }

    private void cleanup(Path dir) {
        try {
            Files.walk(dir)
                    .sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException ignored) {
                            // Windows may briefly hold locks; temp dirs are cleaned by OS eventually.
                        }
                    });
        } catch (IOException ignored) {
            // same as above
        }
    }

    private static final class CompileFailed extends RuntimeException {
        CompileFailed(String message) {
            super(message);
        }
    }
}
