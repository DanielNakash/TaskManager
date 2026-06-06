export const GoogleG = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.8-9.8 6.8-17.4z"/>
    <path fill="#FBBC05" d="M10.3 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.8-6.1z"/>
    <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2 1.4-4.7 2.3-7.9 2.3-6.4 0-11.8-3.7-13.7-9.1l-7.8 6.1C6.4 42.6 14.6 48 24 48z"/>
  </svg>
);

export const Check = ({ s = 16, c = '#fff', w = 3 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5l4.5 4.5L19 7" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Plus = ({ s = 22, c = '#fff', w = 2.6 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={c} strokeWidth={w} strokeLinecap="round"/>
  </svg>
);

export const XMark = ({ s = 16, c, w = 2.4 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={w} strokeLinecap="round"/>
  </svg>
);

export const Trash = ({ s = 17, c }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
