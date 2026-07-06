import type { ParamMatcher } from '@sveltejs/kit';

// Rutas públicas tipo /@salonregias
export const match: ParamMatcher = (param) => /^@[a-z0-9]{1,30}$/.test(param);
