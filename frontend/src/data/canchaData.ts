
import { Cancha } from '../types';

export const CANCHA_EJEMPLO: Cancha = {
  id: 'cancha-el-prado',
  nombre: 'Cancha El Prado',
  ubicacion: 'Armenia, Centro',
  distancia: '1.2 km de ti',
  tipo: 'Fútbol 11',
  superficie: 'Grama sintética',
  dimensiones: '100 × 64 metros',
  jugadoresPorEquipo: 11,
  precioPorHora: 120000,
  tasaServicio: 6000,
  rating: 4.8,
  totalReseñas: 38,
  disponibleHoy: true,
  altaDemanda: true,
  descripcion: [
    'Cancha El Prado es una instalación de fútbol profesional ubicada en el corazón de Armenia. Cuenta con grama sintética de última generación, iluminación LED para partidos nocturnos y camerinos completamente equipados.',
    'Ideal para partidos amistosos, torneos locales o entrenamientos.',
  ],
  caracteristicas: [
    { label: 'Tipo de cancha',       valor: 'Fútbol 11' },
    { label: 'Jugadores por equipo', valor: '11 jugadores' },
    { label: 'Superficie',           valor: 'Grama sintética' },
    { label: 'Dimensiones',          valor: '100 × 64 metros' },
  ],
  horarios: [
    { dia: 'Lun', horas: '6:00 – 22:00' },
    { dia: 'Mar', horas: '6:00 – 22:00' },
    { dia: 'Mié', horas: '6:00 – 22:00' },
    { dia: 'Jue', horas: '6:00 – 22:00' },
    { dia: 'Vie', horas: '6:00 – 23:00' },
    { dia: 'Sáb', horas: '7:00 – 23:00', esFinde: true },
    { dia: 'Dom', horas: '7:00 – 21:00', esFinde: true },
  ],
  reseñas: [
    {
      iniciales: 'JM',
      nombre:    'Juan Mejía',
      fecha:     'Hace 3 días',
      estrellas: 5,
      texto:     'Excelente cancha, la grama está en perfectas condiciones y la iluminación nocturna es muy buena. Volveremos pronto.',
    },
    {
      iniciales: 'SC',
      nombre:    'Sofía Castro',
      fecha:     'Hace 1 semana',
      estrellas: 4,
      texto:     'Muy buen lugar y el personal es amable.',
    },
  ],
};

export const HORARIOS_SELECT: string[] = [
  '06:00 – 07:00',
  '07:00 – 08:00',
  '08:00 – 09:00',
  '09:00 – 10:00',
  '10:00 – 11:00',
  '14:00 – 15:00',
  '15:00 – 16:00',
  '16:00 – 17:00',
  '17:00 – 18:00',
  '18:00 – 19:00',
  '19:00 – 20:00',
  '20:00 – 21:00',
  '21:00 – 22:00',
];
