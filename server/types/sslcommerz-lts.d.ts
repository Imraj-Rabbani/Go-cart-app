declare module "sslcommerz-lts" {
    export default class SSLCommerzPayment {
        constructor(storeId: string, storePassword: string, isLive: boolean);
        init(data: Record<string, any>): Promise<any>;
        validate(data: Record<string, any>): Promise<any>;
    }
}
