import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {ConexionesService} from "../conexiones.service";
import {Conexion} from "../conexion";
import {EstacionesService} from "../estaciones.service";
import {PerfilService} from "../perfil.service";
import {PatinetesService} from "../patinetes.service";
import {ICreateOrderRequest} from "ngx-paypal";

@Component({
  selector: 'app-conexiones-modal',
  templateUrl: './conexiones-modal.component.html',
  styleUrls: ['./conexiones-modal.component.scss']
})
export class ConexionesModalComponent {

  conexion: any = {};
  formulario!: FormGroup;
  @Input() puesto: any;
  patinete: any;
  @Input() patinetesList: any;
  @Input() estacion: any;
  public payPalConfig: any;
  public showPaypalButtons: boolean | undefined;


  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private conexionService: ConexionesService,
    private estacionService: EstacionesService,
    private perfilService: PerfilService,
    private patineteService: PatinetesService,
  ) {

  }

  ngOnInit() {
    this.formulario = this.fb.group({
      patinetesList: new FormControl('', Validators.required)
    })
    this.conexionService.getConexionActual(this.perfilService.getLoggedInUser(), this.puesto);
    this.conexion = this.conexionService.conexionActual;
  }

  pay() {
    this.showPaypalButtons = true;
    this.payPalConfig = {
      currency: "EUR",
      clientId: "ATuLX_QcwckG9Q5xwziJqZfpp5heEUlhwJvMEIuwp8Gu152nMRlanLlrakvzcnoYPb0I76ujuxj80j_d",
      createOrder: () =>
        <ICreateOrderRequest>{
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "EUR",
                value: "9.99",
                breakdown: {
                  item_total: {
                    currency_code: "EUR",
                    value: "9.99"
                  }
                }
              },
              items: [
                {
                  name: "Enterprise Subscription",
                  quantity: "1",
                  category: "DIGITAL_GOODS",
                  unit_amount: {
                    currency_code: "EUR",
                    value: "9.99"
                  }
                }
              ]
            }
          ]
        },
      advanced: {
        commit: "true"
      },
      style: {
        label: "paypal",
        layout: "vertical"
      },
      onApprove: (data: any, actions: { order: { get: () => Promise<any>; }; }) => {
        // console.log(
        //   "onApprove - transaction was approved, but not authorized",
        //   data,
        //   actions
        // );
        actions.order.get().then((details: any) => {
          // console.log(
          //   "onApprove - you can get full order details inside onApprove: ",
          //   details
          // );
        });
      },
      onClientAuthorization: (data: any) => {
        console.log(
          "onClientAuthorization - you should probably inform your server about completed transaction at this point",
          data
        );
        this.desconectar()
      },
      onCancel: (data: any, actions: any) => {
        console.log("OnCancel", data, actions);
      },
      onError: (err: any) => {
        console.log("OnError", err);
      },
      onClick: (data: any, actions: any) => {
        console.log("onClick", data, actions);
      }
    };
  }

  back() {
    this.showPaypalButtons = false;
  }

  setConexion() {
    // IMPORTANTE!!! CREAR UNA PÁGINA DE RESUMEN QUE MANDE AL  USUARIO A LA MISMA AL INICIAR CORRECTAMENTE UNA CONEXIÓN
    const idUsuario = this.perfilService.getLoggedInUser();
    this.patinete = this.formulario.get('patinetesList')!.value;
    this.conexion = new Conexion(
      `http://127.0.0.1:8000/puesto/${this.puesto.id}/`,
      `http://127.0.0.1:8000/patinete/${this.patinete}/`,
      `http://127.0.0.1:8000/usuario/${idUsuario}/`,
      null,
      121,
      10,
      false,
    );
    this.conexionService.postConexion(this.conexion).subscribe((response: any) => {
      // this.conexionId = response.id; // Guarda el ID de la conexión creada en una variable
      this.puesto.disponible = false;
      this.estacionService.updatePuesto(this.puesto.id, this.puesto).subscribe();
      this.patineteService.setPatineteSeleccionado(this.patinete);
    });
  }

  desconectar() {
    this.puesto.disponible = true;
    this.conexion.horaDesconexion = new Date().toISOString();
    this.conexion.finalizada = true;
    this.estacionService.updatePuesto(this.puesto.id, this.puesto).subscribe();
    this.conexionService.updateConexion(this.conexion.id, this.conexion).subscribe();
  }

}
