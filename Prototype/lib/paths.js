// Next Link adds basePath automatically; plain links and images need it explicitly.
export const withBasePath = path => `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${path}`;
