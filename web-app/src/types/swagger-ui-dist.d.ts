declare module "swagger-ui-dist/swagger-ui-bundle.js" {
  type SwaggerOptions = {
    url: string;
    domNode: HTMLElement;
    deepLinking?: boolean;
    docExpansion?: "list" | "full" | "none";
    tryItOutEnabled?: boolean;
  };
  const SwaggerUIBundle: (options: SwaggerOptions) => unknown;
  export default SwaggerUIBundle;
}
