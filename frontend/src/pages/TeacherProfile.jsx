import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";

import {
  Avatar, Alert, Backdrop, Badge, Box, Button, Card, CardContent, Chip, CircularProgress, 
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, Fade, Grow, IconButton, 
  LinearProgress, Paper, Skeleton, Slide, Snackbar, Stack, TextField, Tooltip, Typography, 
  alpha, useTheme
} from "@mui/material";

import Grid from "@mui/material/Grid";

import {
  Badge as BadgeIcon, CameraAlt, Close, Email, PhotoCamera, Save, School, 
  Verified, MenuBook, Work, AccountBox
} from "@mui/icons-material";

const API = "http://localhost:8080/api";
axios.defaults.withCredentials = true;

// ---------------------------------------------------------------
// Small reusable bits
// ---------------------------------------------------------------

const SlideUpTransition = React.forwardRef(function SlideUpTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function SectionHeader({ icon, title, subtitle, accent }) {
  return (
    <Box sx={{ width: "100%", mb: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40, height: 40, borderRadius: "12px", display: "flex", alignItems: "center", 
            justifyContent: "center", background: accent, color: "#fff", 
            boxShadow: `0 6px 16px ${alpha("#000", 0.15)}`
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Stack>
      <Divider sx={{ mt: 2, borderColor: alpha("#000", 0.06) }} />
    </Box>
  );
}

// Fields required for a "complete" profile
const REQUIRED_FIELDS = [
  "firstName", "lastName", "email", "phone", "staffId", "department", "designation", "qualification"
];

function TeacherProfile() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const notify = useCallback((msg, type) => { setSnackbar({ open: true, message: msg, severity: type }); }, []);

  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const getProfile = useCallback(async (id) => {
    try {
      // 💡 Assumes you create a TeacherProfileController in the backend!
      const res = await axios.get(`${API}/teacher/profile/user/${id}`);
      setProfile(res.data);
      if (res.data.profilePhoto) {
        setPreview(`http://localhost:8080/uploads/profile/teachers/${res.data.profilePhoto}`);
      }
    } catch (error) {
      setProfile({
        user: { id: id }, staffId: "", firstName: "", lastName: "", email: "", phone: "", 
        address: "", department: "", designation: "Assistant Professor", qualification: "", 
        experience: "", bio: "", subjects: ""
      });
      notify("Please fill out your details to create your faculty profile.", "info");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const getUserSession = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/me`);
      setUserId(res.data.id);
      getProfile(res.data.id);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }, [getProfile]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    getUserSession();
    return () => stopCamera();
  }, [getUserSession, stopCamera]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // 💡 Logic to manually add and remove Subjects / Expertise
  const handleAddSubject = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newSubject = e.target.value.trim();
      if (newSubject) {
        const currentSubjects = profile.subjects ? profile.subjects.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (!currentSubjects.includes(newSubject)) {
          setProfile({ ...profile, subjects: [...currentSubjects, newSubject].join(', ') });
        }
        e.target.value = '';
      }
    }
  };

  const handleRemoveSubject = (subjectToRemove) => {
    const currentSubjects = profile.subjects.split(',').map(s => s.trim()).filter(Boolean);
    const updatedSubjects = currentSubjects.filter(s => s !== subjectToRemove);
    setProfile({ ...profile, subjects: updatedSubjects.join(', ') });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const profileData = {
        user: { id: userId },
        staffId: profile.staffId, firstName: profile.firstName, lastName: profile.lastName, 
        email: profile.email, phone: profile.phone, address: profile.address, 
        department: profile.department, designation: profile.designation, qualification: profile.qualification, 
        experience: profile.experience ? Number(profile.experience) : 0, bio: profile.bio, subjects: profile.subjects
      };

      if (profile.id) {
        await axios.put(`${API}/teacher/profile/${profile.id}`, profileData);
        notify("Faculty Profile updated successfully", "success");
      } else {
        const res = await axios.post(`${API}/teacher/profile`, profileData);
        setProfile(res.data);
        notify("Faculty Profile created successfully", "success");
      }
    } catch (error) {
      console.log(error?.response);
      notify(error?.response?.data?.message || "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const startCamera = async () => {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      notify("Could not access camera. Please check permissions.", "error");
      setCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          setSelectedImage(file);
          setPreview(URL.createObjectURL(file));
          stopCamera();
        }
      }, "image/jpeg");
    }
  };

  const uploadPhoto = async () => {
    if (!profile.id) return notify("Save profile details first before uploading a photo.", "warning");
    if (!selectedImage) return notify("Choose or take an image first", "warning");

    setUploading(true);
    const data = new FormData();
    data.append("file", selectedImage);

    try {
      await axios.post(`${API}/teacher/profile/upload-photo/${profile.id}`, data);
      notify("Photo uploaded successfully", "success");
      getProfile(userId);
    } catch (error) {
      notify("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const completion = useMemo(() => {
    if (!profile) return 0;
    const filled = REQUIRED_FIELDS.filter((f) => String(profile[f] ?? "").trim().length > 0).length;
    return Math.round((filled / REQUIRED_FIELDS.length) * 100);
  }, [profile]);

  if (loading) {
    return (
      <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
        <Skeleton variant="text" width={260} height={56} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={380} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={380} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 4, textAlign: "center", mt: 10 }}>
        <Typography variant="h5" color="error" fontWeight={700}>Authentication Required</Typography>
        <Typography color="text.secondary">Please log in to view your profile.</Typography>
      </Box>
    );
  }

  const gradientPrimary = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`;
  const gradientViolet = "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)";
  const gradientRose = "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)";
  const gradientTeal = "linear-gradient(135deg, #06B6D4 0%, #0EA5E9 100%)";
  const gradientAmber = "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)";

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, pb: 12, maxWidth: 1200, mx: "auto", minHeight: "100vh", background: "radial-gradient(1200px 600px at 10% -10%, rgba(124,58,237,0.06), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(14,165,233,0.06), transparent)" }}>
      <Fade in timeout={500}>
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ background: gradientPrimary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px" }}>Faculty Profile</Typography>
            <Typography variant="body2" color="text.secondary">Manage your professional details and subjects</Typography>
          </Box>
          <Chip icon={completion === 100 ? <Verified sx={{ color: "#fff !important" }} /> : undefined} label={`${completion}% complete`} sx={{ fontWeight: 700, color: "#fff", background: completion === 100 ? gradientTeal : gradientRose, px: 1 }} />
        </Box>
      </Fade>

      <Grid container spacing={3}>
        {/* LEFT COLUMN — Avatar & Photo Controls */}
        <Grid item xs={12} md={4}>
          <Fade in={mounted} timeout={600}>
            <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 5, position: "sticky", top: 16, background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`, backdropFilter: "blur(12px)", border: `1px solid ${alpha("#000", 0.06)}`, boxShadow: "0 20px 40px -20px rgba(80,50,200,0.25)" }}>
              <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }} badgeContent={<Tooltip title="Take a live photo"><IconButton onClick={startCamera} size="small" sx={{ background: gradientPrimary, color: "#fff", boxShadow: "0 4px 12px rgba(37,99,235,0.4)", "&:hover": { background: gradientPrimary, filter: "brightness(1.1)" } }}><CameraAlt fontSize="small" /></IconButton></Tooltip>}>
                <Avatar src={preview} sx={{ width: 176, height: 176, mx: "auto", mb: 1, fontSize: 56, fontWeight: 700, border: "4px solid transparent", backgroundImage: `${gradientPrimary}, ${gradientPrimary}`, backgroundOrigin: "border-box", backgroundClip: "content-box, border-box", boxShadow: "0 12px 28px -8px rgba(37,99,235,0.45)", transition: "transform 0.35s ease", "&:hover": { transform: "scale(1.03)" } }}>
                  {profile.firstName?.charAt(0) || "F"}
                </Avatar>
              </Badge>

              <Stack spacing={1.2} sx={{ mt: 3 }}>
                <Button component="label" variant="contained" fullWidth startIcon={<PhotoCamera />} sx={{ borderRadius: 3, py: 1.1, textTransform: "none", fontWeight: 600, background: gradientPrimary, boxShadow: "0 8px 20px -6px rgba(37,99,235,0.5)", transition: "all 0.25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 24px -6px rgba(37,99,235,0.6)" } }}>
                  Choose file
                  <input hidden type="file" accept="image/*" onChange={selectImage} />
                </Button>
                <Button fullWidth variant="outlined" onClick={uploadPhoto} disabled={uploading} startIcon={uploading ? <CircularProgress size={16} /> : null} sx={{ borderRadius: 3, py: 1.1, textTransform: "none", fontWeight: 600, borderWidth: 2, "&:hover": { borderWidth: 2, background: alpha(theme.palette.primary.main, 0.06) } }}>
                  {uploading ? "Uploading..." : "Upload selected photo"}
                </Button>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h5" fontWeight={800}>{profile.firstName || "New"} {profile.lastName || "Faculty"}</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mt: 0.5 }}>{profile.designation || "Faculty Member"}</Typography>
              
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }} flexWrap="wrap">
                <Chip icon={<School sx={{ color: "#fff !important" }} />} label={profile.department || "No department"} sx={{ background: gradientPrimary, color: "#fff", fontWeight: 600 }} />
                {profile.staffId && <Chip icon={<BadgeIcon sx={{ color: "#fff !important" }} />} label={profile.staffId} sx={{ background: gradientAmber, color: "#fff", fontWeight: 600 }} />}
              </Stack>

              <Box sx={{ mt: 4, textAlign: "left" }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Profile strength</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>{completion}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={completion} sx={{ height: 8, borderRadius: 5, backgroundColor: alpha(theme.palette.primary.main, 0.1), "& .MuiLinearProgress-bar": { borderRadius: 5, background: completion === 100 ? gradientTeal : gradientRose } }} />
              </Box>
            </Paper>
          </Fade>
        </Grid>

        {/* RIGHT COLUMN — Form Cards */}
        <Grid item xs={12} md={8}>
          <Fade in={mounted} timeout={800}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* CARD 1: PERSONAL */}
              <Card elevation={0} sx={{ borderRadius: 5, border: `1px solid ${alpha("#000", 0.06)}`, boxShadow: "0 10px 30px -20px rgba(0,0,0,0.1)" }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <SectionHeader icon={<AccountBox fontSize="small" />} title="Personal Information" subtitle="Your identity and contact details" accent={gradientPrimary} />
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Staff ID / Employee Code *" name="staffId" value={profile.staffId || ""} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Official Email *" name="email" value={profile.email || ""} onChange={handleChange} />
                    </Grid>
                    {[["firstName", "First Name *"], ["lastName", "Last Name"], ["phone", "Contact Number"]].map((item) => (
                      <Grid item xs={12} md={4} key={item[0]}>
                        <TextField fullWidth label={item[1]} name={item[0]} value={profile[item[0]] || ""} onChange={handleChange} />
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={2} label="Residential Address" name="address" value={profile.address || ""} onChange={handleChange} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* CARD 2: PROFESSIONAL */}
              <Card elevation={0} sx={{ borderRadius: 5, border: `1px solid ${alpha("#000", 0.06)}`, boxShadow: "0 10px 30px -20px rgba(0,0,0,0.1)" }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <SectionHeader icon={<Work fontSize="small" />} title="Professional Details" subtitle="Your role and academic qualifications" accent={gradientTeal} />
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Department *" name="department" value={profile.department || ""} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Designation *" name="designation" placeholder="e.g. Assistant Professor" value={profile.designation || ""} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField fullWidth label="Highest Qualification *" name="qualification" placeholder="e.g. Ph.D in Computer Science" value={profile.qualification || ""} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Experience (Years)" name="experience" type="number" value={profile.experience || ""} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={3} label="Professional Bio / Summary" name="bio" placeholder="Write a short summary about your academic journey..." value={profile.bio || ""} onChange={handleChange} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* CARD 3: SUBJECTS & EXPERTISE (Interactive) */}
              <Card elevation={0} sx={{ borderRadius: 5, border: `1px solid ${alpha("#000", 0.06)}`, boxShadow: "0 10px 30px -20px rgba(0,0,0,0.1)" }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <SectionHeader icon={<MenuBook fontSize="small" />} title="Subjects & Expertise" subtitle="Type a subject or skill and press Enter to add it" accent={gradientViolet} />
                  <Box sx={{ p: 3, borderRadius: 3, border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                    <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                      {profile.subjects && profile.subjects.split(',').map(s => s.trim()).filter(Boolean).map((subject, idx) => (
                        <Chip key={idx} label={subject} onDelete={() => handleRemoveSubject(subject)} color="secondary" sx={{ fontWeight: 600, borderRadius: '8px' }} />
                      ))}
                      {(!profile.subjects || profile.subjects.trim() === "") && (
                        <Typography variant="body2" color="text.secondary">No subjects added yet.</Typography>
                      )}
                    </Stack>
                    <TextField fullWidth variant="outlined" placeholder="e.g. Data Structures, Python, Machine Learning (Press Enter to add)" onKeyDown={handleAddSubject} sx={{ bgcolor: "#fff", borderRadius: 2 }} />
                  </Box>
                </CardContent>
              </Card>

            </Box>
          </Fade>
        </Grid>
      </Grid>

      {/* STICKY SAVE BAR */}
      <Slide direction="up" in mountOnEnter unmountOnExit>
        <Paper elevation={0} sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10, px: { xs: 2, md: 6 }, py: 2, display: "flex", justifyContent: { xs: "center", md: "flex-end" }, background: alpha(theme.palette.background.paper, 0.85), backdropFilter: "blur(14px)", borderTop: `1px solid ${alpha("#000", 0.06)}` }}>
          <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={saving} onClick={saveProfile} sx={{ px: 5, py: 1.3, borderRadius: 3, fontWeight: 700, textTransform: "none", background: gradientPrimary, boxShadow: "0 10px 24px -6px rgba(37,99,235,0.55)", transition: "all 0.25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 14px 30px -6px rgba(37,99,235,0.65)" } }}>
            {saving ? "Saving..." : profile.id ? "Update Profile" : "Create Profile"}
          </Button>
        </Paper>
      </Slide>

      {/* CAMERA DIALOG */}
      <Dialog open={cameraOpen} onClose={stopCamera} maxWidth="sm" fullWidth TransitionComponent={SlideUpTransition} PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: gradientPrimary, color: "#fff", fontWeight: 700 }}>
          Take a Live Photo
          <IconButton onClick={stopCamera} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 3, background: "#0B0B12" }}>
          <Box sx={{ width: "100%", borderRadius: 3, overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)", boxShadow: "0 0 0 4px rgba(37,99,235,0.15)" }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: "100%", display: "block", backgroundColor: "#000" }} />
          </Box>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", py: 3, background: "#0B0B12" }}>
          <Button variant="contained" onClick={capturePhoto} startIcon={<CameraAlt />} size="large" sx={{ px: 4, borderRadius: 3, fontWeight: 700, textTransform: "none", background: gradientPrimary, boxShadow: "0 10px 24px -6px rgba(37,99,235,0.6)" }}>Capture Photo</Button>
        </DialogActions>
      </Dialog>

      <Backdrop open={saving} sx={{ zIndex: 20, color: "#fff", backdropFilter: "blur(2px)" }}><CircularProgress color="inherit" /></Backdrop>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} TransitionComponent={SlideUpTransition}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 3, boxShadow: "0 10px 24px -6px rgba(0,0,0,0.3)" }} onClose={handleCloseSnackbar}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default TeacherProfile;