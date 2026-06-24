import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bannersQuery } from "@/lib/queries";
import { storageUrl } from "@/lib/supabase";

export function BannerCarousel() {
  const { data: banners = [], isLoading } = useQuery(bannersQuery);
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const on = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", on);
    on();
    const id = setInterval(() => embla.scrollNext(), 6000);
    return () => clearInterval(id);
  }, [embla]);

  const scrollTo = useCallback((i: number) => embla?.scrollTo(i), [embla]);

  if (isLoading) return <div className="container-pro mt-6 h-[260px] md:h-[440px] rounded-2xl bg-secondary animate-pulse" />;
  if (!banners.length) return null;

  return (
    <section className="container-pro mt-6">
      <div className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-primary)]">
        <div ref={emblaRef}>
          <div className="flex">
            {banners.map((b) => {
              const desktop = storageUrl(b.imagen_desktop);
              const mobile = storageUrl(b.imagen_mobile) || desktop;
              const content = (
                <div className="relative w-full">
                  <picture>
                    <source media="(min-width: 768px)" srcSet={desktop} />
                    <img src={mobile} alt={b.titulo ?? ""} className="block w-full h-[280px] md:h-[440px] object-cover" loading="lazy" />
                  </picture>
                  {b.texto_visible !== false && (b.titulo || b.subtitulo) && (
                    <div className="absolute inset-0 flex items-end md:items-center bg-gradient-to-t md:bg-gradient-to-r from-black/55 via-black/20 to-transparent">
                      <div className="container-pro pb-6 md:pb-0">
                        <div className="max-w-xl">
                          {b.titulo && (
                            <h2 className="font-display text-3xl md:text-5xl text-white drop-shadow-lg leading-tight" style={{ color: b.texto_color || "#fff" }}>{b.titulo}</h2>
                          )}
                          {b.subtitulo && (
                            <p className="mt-3 text-white text-base md:text-lg drop-shadow-md leading-relaxed" style={{ color: b.texto_color || "#fff" }}>{b.subtitulo}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
              return (
                <div className="min-w-0 flex-[0_0_100%]" key={b.id}>
                  {b.enlace ? <a href={b.enlace}>{content}</a> : content}
                </div>
              );
            })}
          </div>
        </div>
        <button onClick={() => embla?.scrollPrev()} className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/85 hover:bg-white shadow"><ChevronLeft className="h-5 w-5" /></button>
        <button onClick={() => embla?.scrollNext()} className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/85 hover:bg-white shadow"><ChevronRight className="h-5 w-5" /></button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button key={i} onClick={() => scrollTo(i)} className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
