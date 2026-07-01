export const isHtml = (s) => /<[a-z][\s\S]*?>/i.test(s || "");

export const stripHtml = (s) =>
  (s || "").replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

export function sanitizeHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  tmp.querySelectorAll("script,style,iframe,object,embed,form").forEach((el) => el.remove());
  tmp.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes)
      // eslint-disable-next-line no-script-url
      .filter((a) => a.name.startsWith("on") || a.value.toLowerCase().startsWith("javascript:"))
      .forEach((a) => el.removeAttribute(a.name));
  });
  return tmp.innerHTML;
}
