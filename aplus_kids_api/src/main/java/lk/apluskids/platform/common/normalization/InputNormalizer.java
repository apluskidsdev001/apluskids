package lk.apluskids.platform.common.normalization;

import java.util.Locale;
import java.util.regex.Pattern;
import lk.apluskids.platform.common.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class InputNormalizer {
    private static final Pattern E164 = Pattern.compile("^\\+[1-9]\\d{7,14}$");

    public String name(String value) {
        return value == null ? null : value.trim().replaceAll("\\s+", " ");
    }

    public String email(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    public String phone(String value) {
        String compact = value == null ? "" : value.trim().replaceAll("[\\s()\\-]", "");
        if (compact.startsWith("00")) compact = "+" + compact.substring(2);
        if (compact.startsWith("0")) compact = "+94" + compact.substring(1);
        if (!compact.startsWith("+")) compact = "+94" + compact;
        if (!E164.matcher(compact).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PHONE", "Enter a valid phone number.");
        }
        return compact;
    }
}
