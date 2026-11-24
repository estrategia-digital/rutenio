import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import { MapaThemeService } from '../../../../common/services/mapa-theme.service';
import { SatrackApiService } from '../../servicios/satrack-api.service';
import { SatrackPosicion, SatrackUbicacionRespuesta } from '../../interfaces/satrack.interface';

const INTERVALO_MS = 30000;
const CENTRO_DEFECTO: google.maps.LatLngLiteral = { lat: 4.6097, lng: -74.0817 };

@Component({
  selector: 'app-satrack-mapa',
  standalone: true,
  imports: [CommonModule, RouterLink, GoogleMapsModule],
  templateUrl: './satrack-mapa.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SatrackMapaComponent implements OnInit {
  @ViewChild(MapInfoWindow) infoWindow?: MapInfoWindow;

  private _api = inject(SatrackApiService);
  private _cdr = inject(ChangeDetectorRef);
  private _destroyRef = inject(DestroyRef);
  public mapaTheme = inject(MapaThemeService);

  cargando = true;
  error: string | null = null;
  cache = false;
  posiciones: SatrackPosicion[] = [];
  seleccionada: SatrackPosicion | null = null;
  ultimaActualizacion: Date | null = null;

  centro = CENTRO_DEFECTO;
  zoom = 12;

  opcionesMapa: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  };

  ngOnInit(): void {
    interval(INTERVALO_MS)
      .pipe(
        startWith(0),
        switchMap(() =>
          this._api.obtenerUbicacion().pipe(
            catchError((err) =>
              of({
                error: true,
                cache: false,
                posiciones: [],
                mensaje: err?.error?.mensaje || err?.error?.detail || 'No se pudo consultar Satrack',
              } as SatrackUbicacionRespuesta & { mensaje: string }),
            ),
          ),
        ),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((resp) => this._aplicar(resp));
  }

  private _aplicar(resp: SatrackUbicacionRespuesta & { mensaje?: string }): void {
    this.cargando = false;
    if (resp.error) {
      this.error = resp.mensaje || 'No se pudo consultar Satrack';
    } else {
      this.error = null;
      this.cache = resp.cache;
      this.posiciones = (resp.posiciones || []).filter((p) => p.latitud != null && p.longitud != null);
      this.ultimaActualizacion = new Date();
      this._centrar();
    }
    this._cdr.markForCheck();
  }

  private _centrar(): void {
    if (this.posiciones.length === 0) return;
    const lats = this.posiciones.map((p) => Number(p.latitud));
    const lngs = this.posiciones.map((p) => Number(p.longitud));
    this.centro = {
      lat: lats.reduce((a, b) => a + b, 0) / lats.length,
      lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
    };
    if (this.posiciones.length === 1) {
      this.zoom = 14;
      return;
    }
    const maxDiff = Math.max(
      Math.max(...lats) - Math.min(...lats),
      Math.max(...lngs) - Math.min(...lngs),
    );
    if (maxDiff > 1) this.zoom = 8;
    else if (maxDiff > 0.5) this.zoom = 10;
    else if (maxDiff > 0.1) this.zoom = 12;
    else this.zoom = 14;
  }

  posicion(p: SatrackPosicion): google.maps.LatLngLiteral {
    return { lat: Number(p.latitud), lng: Number(p.longitud) };
  }

  icono(p: SatrackPosicion): google.maps.Icon {
    const encendido = Number(p.ignicion) === 1;
    const color = encendido ? '#16a34a' : '#6b7280';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.6" fill="#ffffff" stroke="none"/>
      </svg>`;
    return {
      url: `data:image/svg+xml;base64,${btoa(svg)}`,
      scaledSize: new google.maps.Size(30, 42),
      anchor: new google.maps.Point(15, 42),
      labelOrigin: new google.maps.Point(15, 15),
    };
  }

  etiqueta(p: SatrackPosicion): google.maps.MarkerLabel {
    return {
      text: p.placa,
      color: this.mapaTheme.esDark() ? '#e5e7eb' : '#111827',
      fontSize: '11px',
      fontWeight: '600',
    };
  }

  abrirInfo(marker: MapMarker, p: SatrackPosicion): void {
    this.seleccionada = p;
    this._cdr.markForCheck();
    this.infoWindow?.open(marker);
  }

  refrescar(): void {
    this.cargando = true;
    this._cdr.markForCheck();
    this._api
      .obtenerUbicacion()
      .pipe(
        catchError((err) =>
          of({
            error: true,
            cache: false,
            posiciones: [],
            mensaje: err?.error?.mensaje || err?.error?.detail || 'No se pudo consultar Satrack',
          } as SatrackUbicacionRespuesta & { mensaje: string }),
        ),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((resp) => this._aplicar(resp));
  }
}
