package com.eduai.backend_java.models;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

/** Serializes a question's hidden test cases to a JSON TEXT column. */
@Converter
public class HiddenCasesConverter implements AttributeConverter<List<Question.QuestionTestCase>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<Question.QuestionTestCase> attribute) {
        if (attribute == null || attribute.isEmpty()) return null;
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public List<Question.QuestionTestCase> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return null;
        try {
            return MAPPER.readValue(dbData, new TypeReference<List<Question.QuestionTestCase>>() {});
        } catch (Exception e) {
            return null;
        }
    }
}
