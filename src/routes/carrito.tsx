import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { storageUrl } from "@/lib/supabase";

export const Route = createFileRoute("/carrito")({
  head: () => ({ meta: [{ title: "Carrito · Puerto Rico Online" }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.total());

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-pro py-10">
        <h1 className="font-display text-3xl md:text-4xl">Tu carrito</h1>
        {items.length === 0 ? (
          <div className="card-pro mt-8 p-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Tu carrito está vacío.</p>
            <Link to="/productos" className="btn btn-primary mt-6 inline-flex">Explorar catálogo</Link>
          </div>
        ) : (
          <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="card-pro flex gap-4 p-4">
                  <div className="h-24 w-24 rounded-lg bg-[color:var(--color-background)] grid place-items-center p-2 shrink-0">
                    {i.imagen ? <img src={storageUrl(i.imagen)} alt={i.nombre} className="max-h-full max-w-full object-contain" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/producto/$slug" params={{ slug: i.slug }} className="font-semibold text-sm line-clamp-2 hover:text-[color:var(--color-accent)]">{i.nombre}</Link>
                    <p className="price mt-1 text-sm text-muted-foreground">S/ {i.precio_venta.toFixed(2)}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-[color:var(--color-border)] bg-white">
                        <button onClick={() => setQty(i.id, i.cantidad - 1)} className="grid h-9 w-9 place-items-center hover:bg-secondary"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm font-semibold">{i.cantidad}</span>
                        <button onClick={() => setQty(i.id, i.cantidad + 1)} className="grid h-9 w-9 place-items-center hover:bg-secondary"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="price text-sm font-bold">S/ {(i.precio_venta * i.cantidad).toFixed(2)}</span>
                        <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <aside className="card-pro p-6 h-fit sticky top-24">
              <h3 className="font-display text-lg">Resumen</h3>
              <div className="mt-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold">Total del pedido</span>
                  <span className="price font-bold text-xl">S/ {total.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">El costo de entrega se coordinará por WhatsApp.</p>
              </div>
              <Link to="/checkout" className="btn btn-accent w-full mt-6">Continuar al checkout</Link>
              <Link to="/productos" className="btn btn-ghost w-full mt-2">Seguir comprando</Link>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
