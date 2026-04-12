// src/app/api/mp/crear-preferencia/route.ts
import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paquete, paquete_id, usuario_id, email, titulo, monto, bits_nexo, bits_bonus } = body;

    if (!usuario_id) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const PAQUETES: Record<string, { titulo: string; precio: number; tipo: string; cantidad: number }> = {
      // BIT Nexo
      "bit_nexo_500":       { titulo: "500 BIT Nexo",              precio: 500,   tipo: "bits_nexo",       cantidad: 500   },
      "bit_nexo_1000":      { titulo: "1.000 BIT Nexo",            precio: 1000,  tipo: "bits_nexo",       cantidad: 1000  },
      "bit_nexo_5000":      { titulo: "5.000 BIT Nexo",            precio: 5000,  tipo: "bits_nexo",       cantidad: 5000  },
      "bit_nexo_ilimitado": { titulo: "BIT Nexo Ilimitado 30 días",precio: 10000, tipo: "bits_nexo_ilim",  cantidad: 99999 },
      // BIT Anuncio
      "bit_anuncio_3":      { titulo: "3 BIT Anuncio",             precio: 1000,  tipo: "bits_anuncio",    cantidad: 3     },
      "bit_anuncio_10":     { titulo: "10 BIT Anuncio",            precio: 3000,  tipo: "bits_anuncio",    cantidad: 10    },
      "bit_anuncio_emp_50": { titulo: "50 BIT Anuncio Empresa",    precio: 10000, tipo: "bits_anuncio",    cantidad: 50    },
      // BIT Conexión
      "bit_conexion_1000":      { titulo: "1.000 BIT Conexión",        precio: 1000,  tipo: "bits_conexion",   cantidad: 1000  },
      "bit_conexion_5000":      { titulo: "5.000 BIT Conexión",        precio: 5000,  tipo: "bits_conexion",   cantidad: 5000  },
      "bit_conexion_ilimitado": { titulo: "BIT Conexión Ilimitado 30 días", precio: 10000, tipo: "bits_conexion_ilim", cantidad: 99999 },
      // BIT NexoNet (paquetes de bits)
      "bit_500":            { titulo: "500 BIT NexoNet",           precio: 500,   tipo: "bits_nexo",       cantidad: 500   },
      "bit_1500":           { titulo: "1.500 BIT NexoNet",         precio: 1500,  tipo: "bits_nexo",       cantidad: 1600  },
      "bit_3000":           { titulo: "3.000 BIT NexoNet",         precio: 3000,  tipo: "bits_nexo",       cantidad: 3300  },
      "bit_6000":           { titulo: "6.000 BIT NexoNet",         precio: 6000,  tipo: "bits_nexo",       cantidad: 6800  },
      "bit_12000":          { titulo: "12.000 BIT NexoNet",        precio: 12000, tipo: "bits_nexo",       cantidad: 14000 },
      "bit_30000":          { titulo: "30.000 BIT NexoNet",        precio: 30000, tipo: "bits_nexo",       cantidad: 36000 },
      // BIT Grupo
      "bit_grupo":          { titulo: "BIT Grupo",                 precio: 500,   tipo: "bits_grupo",      cantidad: 500   },
      // BIT Link
      "bit_link":           { titulo: "BIT Link Multimedia",       precio: 500,   tipo: "bits_link",       cantidad: 500   },
      // BIT Adjunto
      "bit_adjunto":        { titulo: "BIT Adjunto",               precio: 500,   tipo: "bits_adjunto",    cantidad: 500   },
      // BIT Búsqueda IA
      "bit_ia_1000":        { titulo: "1.000 BIT Búsqueda IA",     precio: 1000,  tipo: "bits_busqueda_ia",cantidad: 1000  },
      "bit_ia_5000":        { titulo: "5.000 BIT Búsqueda IA",     precio: 5000,  tipo: "bits_busqueda_ia",cantidad: 5000  },
      "bit_ia_ilimitado":   { titulo: "BIT Búsqueda IA Ilimitado 30 días", precio: 10000, tipo: "bits_ia_ilim", cantidad: 99999 },
    };

    // Soporte para llamada desde tienda (titulo+monto) o por ID de paquete
    let pkg: { titulo: string; precio: number; tipo: string; cantidad: number };
    const paqueteKey = paquete || paquete_id || "";

    if (titulo && monto) {
      pkg = {
        titulo: titulo,
        precio: monto,
        tipo: "bits_nexo",
        cantidad: (bits_nexo || 0) + (bits_bonus || 0),
      };
    } else {
      const found = PAQUETES[paqueteKey];
      if (!found) return NextResponse.json({ error: "Paquete inválido" }, { status: 400 });
      pkg = found;
    }

    const preference = {
      items: [{
        id: paquete,
        title: `NexoNet — ${pkg.titulo}`,
        quantity: 1,
        unit_price: pkg.precio,
        currency_id: "ARS",
      }],
      payer: { email: email || "usuario@nexonet.ar" },
      back_urls: {
        success: `https://nexonet.ar/pago/exito?paquete=${paquete}&usuario_id=${usuario_id}`,
        failure: `https://nexonet.ar/pago/error`,
        pending: `https://nexonet.ar/pago/pendiente`,
      },
      auto_return: "approved",
      external_reference: `${usuario_id}|${paquete || paquete_id}|${Date.now()}`,
      notification_url: `https://nexonet.ar/api/mp/webhook`,
      statement_descriptor: "NEXONET",
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("MP Error completo:", JSON.stringify(data));
      return NextResponse.json({ error: data.message || "Error MP", detalle: data }, { status: 500 });
    }

    return NextResponse.json({
      init_point: data.init_point,
      preference_id: data.id,
      paquete: pkg,
    });

  } catch (err) {
    console.error("Error crear-preferencia:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
