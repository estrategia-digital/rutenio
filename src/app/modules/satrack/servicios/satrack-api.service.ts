import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../common/services/http.service';
import {
  SatrackConexion,
  SatrackConexionUpsert,
  SatrackProbarRespuesta,
  SatrackUbicacionRespuesta,
} from '../interfaces/satrack.interface';

@Injectable({ providedIn: 'root' })
export class SatrackApiService {
  private _http = inject(HttpService);

  obtenerConexion(): Observable<SatrackConexion> {
    return this._http.getDetalle<SatrackConexion>('ruteo/satrack/conexion/');
  }

  guardarConexion(datos: SatrackConexionUpsert): Observable<SatrackConexion> {
    return this._http.post<SatrackConexion>('ruteo/satrack/conexion/', datos);
  }

  probarConexion(): Observable<SatrackProbarRespuesta> {
    return this._http.post<SatrackProbarRespuesta>('ruteo/satrack/conexion/probar/', {});
  }

  obtenerUbicacion(): Observable<SatrackUbicacionRespuesta> {
    return this._http.getDetalle<SatrackUbicacionRespuesta>('ruteo/satrack/ubicacion/');
  }
}
