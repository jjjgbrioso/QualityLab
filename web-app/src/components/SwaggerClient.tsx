"use client";

import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

export function SwaggerClient() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    // Loaded only here, because the bundle is large and needs a browser.
    import("swagger-ui-dist/swagger-ui-bundle.js").then(({ default: SwaggerUIBundle }) => {
      if (active && container.current) {
        SwaggerUIBundle({
          url: "/api/v1/openapi.json",
          domNode: container.current,
          deepLinking: true,
          docExpansion: "list",
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return <div ref={container} data-testid="swagger-ui" />;
}
