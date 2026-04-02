"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { isNexoAbierto } from "@/lib/horarios";
import type { Anuncio, Nexo, Rubro, Subrubro } from "@/app/_lib/home-constants";

export function useHomeData() {
  const [anuncios,  setAnuncios]  = useState<Anuncio[]>([]);
  const [nexos,     setNexos]     = useState<Nexo[]>([]);
  const [rubros,    setRubros]    = useState<Rubro[]>([]);
  const [subrubros, setSubrubros] = useState<Subrubro[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [nexoItems, setNexoItems] = useState<any[]>([]);

  useEffect(() => {
    const cargar = async () => {
      const [
        { data: rData }, { data: sData }, { data: aData },
        { data: nData },
      ] = await Promise.all([
        supabase.from("rubros").select("id,nombre").order("nombre"),
        supabase.from("subrubros").select("id,nombre,rubro_id").order("nombre"),
        supabase.from("anuncios").select(`
          id,titulo,precio,moneda,ciudad,provincia,imagenes,avatar_url,banner_url,flash,
          fuente,permuto,created_at,usuario_id,subrubro_id,
          subrubros(nombre,rubros(nombre))
        `).eq("estado", "activo").order("created_at", { ascending: false }).limit(80),
        supabase.from("nexos")
          .select("id,titulo,descripcion,tipo,subtipo,subrubro_id,ciudad,provincia,avatar_url,config,usuario_id,vistas,usuarios:usuario_id(insignia_logro,nombre_usuario,nombre)")
          .order("created_at", { ascending: false }).limit(120),
      ]);

      if (rData) setRubros(rData);
      if (sData) setSubrubros(sData);

      if (aData) {
        let mapped: Anuncio[] = aData.map((a: any) => ({
          id: a.id, titulo: a.titulo, precio: a.precio, moneda: a.moneda,
          ciudad: a.ciudad, provincia: a.provincia, imagenes: a.imagenes || [],
          flash: a.flash || false, fuente: a.fuente || "nexonet",
          permuto: a.permuto || false, usuario_id: a.usuario_id,
          subrubro: a.subrubros?.nombre || "",
          rubro: Array.isArray(a.subrubros?.rubros)
            ? (a.subrubros.rubros[0]?.nombre || "")
            : (a.subrubros?.rubros?.nombre || ""),
        }));

        const uids = [...new Set(mapped.map(a => a.usuario_id).filter(Boolean))];
        if (uids.length > 0) {
          const { data: owners } = await supabase
            .from("usuarios").select("id,bits,bits_promo,bits_free,whatsapp,vis_personal,insignia_logro,nombre_usuario,nombre").in("id", uids);
          if (owners) {
            const ownerMap: Record<string, any> = Object.fromEntries(owners.map((o: any) => [o.id, o]));
            mapped = mapped.map(a => {
              const o = ownerMap[a.usuario_id];
              const totalBits = (o?.bits || 0) + (o?.bits_promo || 0) + (o?.bits_free || 0);
              const waVisible = o?.vis_personal?.whatsapp === true;
              return { ...a, owner_whatsapp: (o?.whatsapp && waVisible && totalBits > 0) ? o.whatsapp : undefined, owner_insignia_logro: o?.insignia_logro || "ninguna", owner_nombre: o?.nombre_usuario || o?.nombre || undefined };
            });
          }
        }
        // Obtener visitas semanales de anuncios
        const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const anuIds = mapped.map(a => a.id);
        if (anuIds.length > 0) {
          const { data: vData } = await supabase
            .from("anuncio_visitas")
            .select("anuncio_id")
            .in("anuncio_id", anuIds)
            .gte("fecha", hace7dias);
          if (vData) {
            const conteo: Record<number, number> = {};
            vData.forEach((v: any) => { conteo[v.anuncio_id] = (conteo[v.anuncio_id] || 0) + 1; });
            mapped = mapped.map(a => ({ ...a, visitas_semana: conteo[a.id] || 0 }));
          }
        }
        // Ordenar: más visitas primero, sin visitas al final en orden original
        const ahora = Date.now();
        mapped.sort((a, b) => {
          const esNuevoA = a.created_at && (ahora - new Date(a.created_at).getTime()) < 48 * 60 * 60 * 1000 ? 1 : 0;
          const esNuevoB = b.created_at && (ahora - new Date(b.created_at).getTime()) < 48 * 60 * 60 * 1000 ? 1 : 0;
          if (esNuevoB !== esNuevoA) return esNuevoB - esNuevoA;
          return (b.visitas_semana || 0) - (a.visitas_semana || 0);
        });
        setAnuncios(mapped);
      }

      let allNexos: Nexo[] = nData ? nData.map((n: any) => ({ ...n, id: String(n.id), owner_insignia_logro: n.usuarios?.insignia_logro || "ninguna", owner_nombre: n.usuarios?.nombre_usuario || n.usuarios?.nombre || undefined })) : [];

      // Obtener visitas semanales de nexos
      const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const nxIds = allNexos.map(n => n.id);
      if (nxIds.length > 0) {
        const { data: nvData } = await supabase
          .from("nexo_visitas")
          .select("nexo_id")
          .in("nexo_id", nxIds)
          .gte("fecha", hace7dias);
        if (nvData) {
          const conteo: Record<string, number> = {};
          nvData.forEach((v: any) => { conteo[v.nexo_id] = (conteo[v.nexo_id] || 0) + 1; });
          allNexos = allNexos.map(n => ({ ...n, visitas_semana: conteo[n.id] || 0 }));
        }
      }
      // Fetch miembros_count para grupos
      const grupoIds = allNexos.filter(n => n.tipo === "grupo").map(n => n.id);
      if (grupoIds.length > 0) {
        const { data: mData } = await supabase.from("nexo_miembros")
          .select("nexo_id").eq("estado","activo").in("nexo_id", grupoIds);
        if (mData) {
          const conteoM: Record<string,number> = {};
          mData.forEach((m:any) => { conteoM[m.nexo_id] = (conteoM[m.nexo_id]||0)+1; });
          allNexos = allNexos.map(n => n.tipo==="grupo" ? {...n, miembros_count: conteoM[n.id]||0} : n);
        }
      }
      const ahoraNexos = Date.now();
        allNexos.sort((a: any, b: any) => {
          const esNuevoA = a.created_at && (ahoraNexos - new Date(a.created_at).getTime()) < 48 * 60 * 60 * 1000 ? 1 : 0;
          const esNuevoB = b.created_at && (ahoraNexos - new Date(b.created_at).getTime()) < 48 * 60 * 60 * 1000 ? 1 : 0;
          if (esNuevoB !== esNuevoA) return esNuevoB - esNuevoA;
          return (b.visitas_semana || 0) - (a.visitas_semana || 0);
        });
      const esEmpServIdsHome = allNexos.filter((n: any) => n.tipo === "empresa" || n.tipo === "servicio").map((n: any) => n.id);
      if (esEmpServIdsHome.length > 0) {
        const { data: horariosHome } = await supabase.from("nexo_horarios").select("nexo_id, dia, hora_desde, hora_hasta, cerrado").in("nexo_id", esEmpServIdsHome);
        if (horariosHome) {
          const hMap: Record<string, any[]> = {};
          horariosHome.forEach((h: any) => { if (!hMap[h.nexo_id]) hMap[h.nexo_id] = []; hMap[h.nexo_id].push(h); });
          allNexos = allNexos.map((n: any) => {
            if (n.tipo !== "empresa" && n.tipo !== "servicio") return n;
            const hs = hMap[n.id];
            if (!hs || !hs.length) return n;
            return { ...n, abierto: isNexoAbierto(hs) };
          });
        }
      }
      setNexos(allNexos);

      // Fetch items recientes de sliders de nexos (novedades, productos, descargas, videos, galeria)
      const nexoIdsConSlider = allNexos.filter(n => ["empresa","servicio","grupo"].includes(n.tipo)).map(n => n.id);
      if (nexoIdsConSlider.length > 0) {
        const { data: slidersData } = await supabase
          .from("nexo_sliders")
          .select("id,nexo_id,tipo,titulo")
          .in("nexo_id", nexoIdsConSlider)
          .eq("activo", true)
          .in("tipo", ["novedades","productos","descargas","videos","galeria"]);

        if (slidersData && slidersData.length > 0) {
          const sliderIds = slidersData.map((s: any) => s.id);
          const { data: itemsData } = await supabase
            .from("nexo_slider_items")
            .select("id,slider_id,titulo,descripcion,url,miniatura_url,precio_bits,created_at")
            .in("slider_id", sliderIds)
            .order("created_at", { ascending: false })
            .limit(60);

          if (itemsData) {
            const sliderMap: Record<string, any> = Object.fromEntries(slidersData.map((s: any) => [s.id, s]));
            const nexoMap: Record<string, any> = Object.fromEntries(allNexos.map((n: any) => [n.id, n]));
            const itemsMapped = itemsData.map((item: any) => {
              const slider = sliderMap[item.slider_id];
              const nexo = slider ? nexoMap[slider.nexo_id] : null;
              return {
                ...item,
                slider_tipo: slider?.tipo,
                slider_titulo: slider?.titulo,
                nexo_id: slider?.nexo_id,
                nexo_titulo: nexo?.titulo,
                nexo_tipo: nexo?.tipo,
                nexo_avatar: nexo?.avatar_url,
              };
            }).filter((i: any) => i.nexo_id);
            setNexoItems(itemsMapped);
          }
        }
      }

      setLoading(false);
    };
    cargar();
  }, []);

  return { anuncios, nexos, rubros, subrubros, loading, nexoItems };
}
