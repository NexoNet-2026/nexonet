export function isNexoAbierto(horarios: { dia: number; hora_desde: string | null; hora_hasta: string | null; cerrado: boolean }[]): boolean {
  if (!horarios || horarios.length === 0) return false;
  const ahora = new Date();
  // getDay(): 0=Dom,1=Lun...6=Sab → convertir a 0=Lun...6=Dom
  const diaSemana = (ahora.getDay() + 6) % 7;
  const horario = horarios.find(h => h.dia === diaSemana);
  if (!horario || horario.cerrado || !horario.hora_desde || !horario.hora_hasta) return false;
  const [hD, mD] = horario.hora_desde.slice(0, 5).split(":").map(Number);
  const [hH, mH] = horario.hora_hasta.slice(0, 5).split(":").map(Number);
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const minutosDesde = hD * 60 + mD;
  const minutosHasta = hH * 60 + mH;
  return minutosAhora >= minutosDesde && minutosAhora < minutosHasta;
}
