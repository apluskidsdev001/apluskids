package lk.apluskids.platform.common.error;

import java.time.Instant;
import java.util.List;

public record ApiError(
    String code,
    String message,
    List<FieldErrorItem> fieldErrors,
    Instant timestamp,
    String path,
    String requestId
) {
    public record FieldErrorItem(String field, String code, String message) {}
}
