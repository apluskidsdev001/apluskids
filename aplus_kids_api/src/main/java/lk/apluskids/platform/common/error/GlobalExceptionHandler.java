package lk.apluskids.platform.common.error;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiError> handleApi(ApiException exception, HttpServletRequest request) {
        return ResponseEntity.status(exception.getStatus()).body(error(
            exception.getCode(), exception.getMessage(), null, request
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        List<ApiError.FieldErrorItem> fields = exception.getBindingResult().getFieldErrors().stream()
            .map(this::fieldError)
            .toList();
        return ResponseEntity.badRequest().body(error(
            "VALIDATION_FAILED", "Some information needs to be corrected.", fields, request
        ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> handleUnreadableMessage(
        HttpMessageNotReadableException exception,
        HttpServletRequest request
    ) {
        return ResponseEntity.badRequest().body(error(
            "INVALID_REQUEST_BODY",
            "The request body contains an invalid or unsupported value.",
            null,
            request
        ));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error(
            "INTERNAL_ERROR", "The request could not be completed.", null, request
        ));
    }

    private ApiError.FieldErrorItem fieldError(FieldError field) {
        return new ApiError.FieldErrorItem(
            field.getField(),
            field.getCode() == null ? "INVALID" : field.getCode().toUpperCase(),
            field.getDefaultMessage() == null ? "Invalid value." : field.getDefaultMessage()
        );
    }

    private ApiError error(String code, String message, List<ApiError.FieldErrorItem> fields, HttpServletRequest request) {
        String requestId = request.getHeader("X-Request-ID");
        if (requestId == null || requestId.isBlank()) requestId = UUID.randomUUID().toString();
        return new ApiError(code, message, fields, Instant.now(), request.getRequestURI(), requestId);
    }
}
