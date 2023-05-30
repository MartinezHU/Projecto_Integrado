import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../usuarios.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { realizarPaginacion } from "../../utils/paginar-utils";
import {ConexionesService} from "../conexiones.service";
import {BusquedasService} from "../busquedas.service";

@Component({
  selector: 'app-historial-conexiones',
  templateUrl: './historial-conexiones.component.html',
  styleUrls: ['./historial-conexiones.component.scss']
})
export class HistorialConexionesComponent implements OnInit {
  listaConexiones: any[] = [];

  formularioBusquedas!: FormGroup;
  filtroBusqueda: any = '';
  ordenBusqueda: any = '';

  conexionesPaginadas: any[] = [];

  paginaActual = 1; // Página actual
  itemsPorPagina = 10; // Cantidad de elementos por página
  totalConexiones = 0; // Total de conexiones

  propiedadSeleccionada = '';
  ordenSeleccionado = '';

  constructor(
    private usuariosService: UsuariosService,
    private conexionesService: ConexionesService,
    private fb: FormBuilder,
    private busquedaService: BusquedasService,
  ) {

    this.filtroBusqueda = {
      patinete: 'Patinete',
      puesto: 'Puesto',
      consumo: 'Consumo',
      horaConexion: 'Hora de conexión',
      horaDesconexion: 'Hora de desconexión',
      importe: 'Importe'
    };

    this.ordenBusqueda = {
      '': 'Ascendente',
      '-': 'Descendente'
    };

    this.formularioBusquedas = this.fb.group({
      barraBusqueda: new FormControl(''),
      filtroBusqueda: new FormControl('horaConexion'), // Establece la opción predeterminada como 'Hora de conexión'
      ordenBusqueda: new FormControl('')
    });

  }

  ngOnInit() {


    this.formularioBusquedas.valueChanges.subscribe(() => {
      this.buscarConexionesPersonales()
    })

    this.buscarConexionesPersonales();

  }

  buscarConexionesPersonales() {
    const userId = this.usuariosService.obtenerIdUsuario();
    const valor = this.formularioBusquedas.get('barraBusqueda')?.value;
    const orden = this.formularioBusquedas.get('ordenBusqueda')?.value;
    const filtro = this.formularioBusquedas.get('filtroBusqueda')?.value;
    this.busquedaService
      .buscarConexiones(userId, valor, orden, filtro)
      .subscribe(response => {
        if (response.status == 200) {
          this.listaConexiones = response.body;
          this.totalConexiones = response.body.length;
          this.conexionesPaginadas = realizarPaginacion(response.body, this.paginaActual, this.itemsPorPagina);
        }
      });
  }
}
