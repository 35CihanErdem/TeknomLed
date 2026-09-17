namespace TeknomLed.Domain.Auth;

public static class RoleNames
{
    public const string Customer = "CUSTOMER";
    public const string Worker = "WORKER";
    public const string Manager = "MANAGER";
    public const string Admin = "ADMIN";
    public const string SuperAdmin = "SUPER_ADMIN";

    public static readonly string[] All =
    [
        Customer,
        Worker,
        Manager,
        Admin,
        SuperAdmin
    ];
}

public static class PermissionNames
{
    public const string OrderView = "ORDER_VIEW";
    public const string OrderUpdate = "ORDER_UPDATE";
    public const string ProductView = "PRODUCT_VIEW";
    public const string ProductCreate = "PRODUCT_CREATE";
    public const string ProductUpdate = "PRODUCT_UPDATE";
    public const string StockView = "STOCK_VIEW";
    public const string StockUpdate = "STOCK_UPDATE";
    public const string UserView = "USER_VIEW";
    public const string UserRoleUpdate = "USER_ROLE_UPDATE";
    public const string ReportView = "REPORT_VIEW";

    public static readonly string[] All =
    [
        OrderView,
        OrderUpdate,
        ProductView,
        ProductCreate,
        ProductUpdate,
        StockView,
        StockUpdate,
        UserView,
        UserRoleUpdate,
        ReportView
    ];
}

public static class ExternalProviders
{
    public const string Google = "GOOGLE";
}
