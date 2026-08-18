package lk.apluskids.platform.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.time.Instant;
import java.util.*;
import lk.apluskids.platform.role.RoleEntity;
import lk.apluskids.platform.user.*;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Rechecks administrator access against current database state on every admin request. */
@Component
public class ActiveAdministratorFilter extends OncePerRequestFilter {
    private static final Set<String> ADMIN_ROLES = Set.of("ROLE_ADMIN", "ROLE_SUPER_ADMIN");
    private final UserRepository users;

    public ActiveAdministratorFilter(UserRepository users) {
        this.users = users;
    }

    @Override protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/admin/");
    }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwt)) {
            chain.doFilter(request, response);
            return;
        }
        UserEntity user;
        try {
            user = users.findByPublicId(UUID.fromString(jwt.getToken().getSubject())).orElse(null);
        } catch (IllegalArgumentException exception) {
            user = null;
        }
        Set<String> claimed = privileged(jwt.getToken().getClaimAsStringList("roles"));
        Set<String> current = user == null ? Set.of() : user.getRoles().stream().map(RoleEntity::getName)
            .filter(ADMIN_ROLES::contains).collect(java.util.stream.Collectors.toSet());
        Instant issuedAt = jwt.getToken().getIssuedAt();
        boolean staleCredentials = user != null && issuedAt != null && user.getCredentialsChangedAt() != null
            && issuedAt.plusSeconds(1).isBefore(user.getCredentialsChangedAt());
        if (user == null || user.getStatus() != AccountStatus.ACTIVE || claimed.isEmpty() || !claimed.equals(current) || staleCredentials) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"code\":\"ADMIN_SESSION_UNAVAILABLE\",\"message\":\"Your administrator access has changed. Please log in again.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private Set<String> privileged(List<String> roles) {
        if (roles == null) return Set.of();
        return roles.stream().filter(ADMIN_ROLES::contains).collect(java.util.stream.Collectors.toSet());
    }
}
