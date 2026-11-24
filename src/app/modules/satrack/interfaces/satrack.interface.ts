export type EstadoSatrack = 'pendiente' | 'activo' | 'error';

export interface SatrackConexion {
  id: number;
  client_id: string;
  grant_type: string;
  estado: EstadoSatrack;
  error_mensaje: string | null;
  token_expira: string | null;
  fecha_ultima_consulta: string | null;
  fecha_conexion: string;
  fecha_actualizacion: string;
}

export interface SatrackConexionUpsert {
  client_id: string;
  client_secret: string;
  grant_type?: string;
}

export interface SatrackProbarRespuesta {
  ok: boolean;
  mensaje?: string;
}

export interface SatrackPosicion {
  placa: string;
  vehiculo_id: number;
  latitud: number | null;
  longitud: number | null;
  direccion?: string | null;
  ciudad?: string | null;
  velocidad?: number | null;
  ignicion?: number | null;
  sentido?: string | null;
  estado_ubicacion?: string | null;
  nivel_bateria?: number | null;
  minutos_mismo_sitio?: number | null;
  fecha_generacion?: string | null;
}

export interface SatrackUbicacionRespuesta {
  error: boolean;
  cache: boolean;
  posiciones: SatrackPosicion[];
}
