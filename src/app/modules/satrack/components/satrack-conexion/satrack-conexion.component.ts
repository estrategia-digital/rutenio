import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { SatrackApiService } from '../../servicios/satrack-api.service';
import { SatrackConexion } from '../../interfaces/satrack.interface';
import { AlertaService } from '../../../../common/services/alerta.service';

@Component({
  selector: 'app-satrack-conexion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './satrack-conexion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SatrackConexionComponent implements OnInit {
  private _api = inject(SatrackApiService);
  private _alerta = inject(AlertaService);
  private _fb = inject(FormBuilder);
  private _cdr = inject(ChangeDetectorRef);

  cargando = true;
  guardando = false;
  probando = false;
  conexion: SatrackConexion | null = null;

  formulario = this._fb.group({
    client_id: ['', Validators.required],
    client_secret: ['', Validators.required],
    grant_type: ['client_credentials'],
  });

  ngOnInit(): void {
    this._cargar();
  }

  private _cargar(): void {
    this.cargando = true;
    this._api.obtenerConexion().pipe(
      finalize(() => { this.cargando = false; this._cdr.markForCheck(); }),
    ).subscribe({
      next: (conexion) => { this.conexion = conexion; this._prefill(conexion); },
      error: () => { this.conexion = null; },
    });
  }

  private _prefill(conexion: SatrackConexion): void {
    this.formulario.patchValue({
      client_id: conexion.client_id,
      grant_type: conexion.grant_type,
      client_secret: '',
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { client_id, client_secret, grant_type } = this.formulario.getRawValue();
    this.guardando = true;
    this._api.guardarConexion({
      client_id: client_id!,
      client_secret: client_secret!,
      grant_type: grant_type || 'client_credentials',
    }).pipe(
      finalize(() => { this.guardando = false; this._cdr.markForCheck(); }),
    ).subscribe({
      next: (conexion) => {
        this.conexion = conexion;
        this._prefill(conexion);
        if (conexion.estado === 'activo') {
          this._alerta.mensajaExitoso('Credenciales guardadas y verificadas');
        } else {
          this._alerta.mensajeError('Guardadas, pero Satrack no respondió', conexion.error_mensaje || '');
        }
      },
      error: (err) => {
        this._alerta.mensajeError('No se pudo guardar', err?.error?.detail || err?.error?.mensaje || '');
      },
    });
  }

  probar(): void {
    if (!this.conexion) return;
    this.probando = true;
    this._api.probarConexion().pipe(
      finalize(() => { this.probando = false; this._cdr.markForCheck(); }),
    ).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this._alerta.mensajaExitoso('Conexión OK');
          this._cargar();
        } else {
          this._alerta.mensajeError('Satrack no responde', resp.mensaje || '');
        }
      },
      error: (err) => {
        this._alerta.mensajeError('Error al probar', err?.error?.mensaje || err?.message || '');
      },
    });
  }
}
