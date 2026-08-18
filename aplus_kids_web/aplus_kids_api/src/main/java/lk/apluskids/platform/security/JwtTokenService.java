package lk.apluskids.platform.security;

import java.time.*;
import java.util.List;
import lk.apluskids.platform.role.RoleEntity;
import lk.apluskids.platform.user.UserEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenService {
    private final JwtEncoder encoder;
    private final Duration accessTokenDuration;

    public JwtTokenService(
        JwtEncoder encoder,
        @Value("${aplus.auth.access-token-duration}") Duration accessTokenDuration
    ) {
        this.encoder = encoder;
        this.accessTokenDuration = accessTokenDuration;
    }

    public AccessToken create(UserEntity user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(accessTokenDuration);
        List<String> roles = user.getRoles().stream().map(RoleEntity::getName).sorted().toList();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("aplus-kids-api")
            .issuedAt(now)
            .expiresAt(expiresAt)
            .subject(user.getPublicId().toString())
            .claim("email", user.getEmail())
            .claim("roles", roles)
            .build();
        String value = encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        return new AccessToken(value, accessTokenDuration.toSeconds());
    }

    public record AccessToken(String value, long expiresIn) {}
}
