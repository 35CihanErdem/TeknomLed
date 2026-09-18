/** Mirror of backend Domain.Auth.PermissionNames — UX only; API is authoritative. */
export const Permission = {
  OrderView: 'ORDER_VIEW',
  OrderUpdate: 'ORDER_UPDATE',
  ProductView: 'PRODUCT_VIEW',
  ProductCreate: 'PRODUCT_CREATE',
  ProductUpdate: 'PRODUCT_UPDATE',
  StockView: 'STOCK_VIEW',
  StockUpdate: 'STOCK_UPDATE',
  UserView: 'USER_VIEW',
  UserRoleUpdate: 'USER_ROLE_UPDATE',
  ReportView: 'REPORT_VIEW',
} as const;

export type PermissionName = (typeof Permission)[keyof typeof Permission];

/** Any of these unlocks the /admin shell. */
export const ADMIN_AREA_PERMISSIONS: PermissionName[] = [
  Permission.ProductView,
  Permission.ProductCreate,
  Permission.ProductUpdate,
  Permission.UserView,
  Permission.UserRoleUpdate,
];
