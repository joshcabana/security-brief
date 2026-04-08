declare module 'sanitize-html' {
  type TransformResult = {
    tagName: string;
    attribs?: Record<string, string | undefined>;
  };

  type TransformTag = (
    tagName: string,
    attribs: Record<string, string>,
  ) => TransformResult;

  type SanitizeHtmlOptions = {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    allowedSchemesAppliedToAttributes?: string[];
    allowProtocolRelative?: boolean;
    transformTags?: Record<string, TransformTag>;
  };

  export default function sanitizeHtml(dirty: string, options?: SanitizeHtmlOptions): string;
}
