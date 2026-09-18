import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ADMIN_AREA_PERMISSIONS, PermissionName } from './permissions';

/** Requires authentication + every listed permission. */
export function permissionGuard(
  ...required: PermissionName[]
): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/account/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (auth.canAll(...required)) {
      return true;
    }

    return router.createUrlTree(['/admin/access-denied'], {
      queryParams: { from: state.url },
    });
  };
}

/** Requires authentication + at least one listed permission. */
export function anyPermissionGuard(
  ...required: PermissionName[]
): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/account/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (auth.canAny(...required)) {
      return true;
    }

    return router.createUrlTree(['/admin/access-denied'], {
      queryParams: { from: state.url },
    });
  };
}

/** Entry to /admin: authenticated + any staff catalog/user/access permission. */
export const adminAreaGuard: CanActivateFn = anyPermissionGuard(
  ...ADMIN_AREA_PERMISSIONS
);
