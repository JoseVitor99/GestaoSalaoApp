import { useEffect, useState } from "react";

const CONSULTA_MOBILE = "(max-width: 768px)";

export default function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(CONSULTA_MOBILE).matches);

  useEffect(() => {
    const mq = window.matchMedia(CONSULTA_MOBILE);
    const atualizar = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", atualizar);
    return () => mq.removeEventListener("change", atualizar);
  }, []);

  return mobile;
}
