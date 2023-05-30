import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {url} from "./utils";

@Injectable({
  providedIn: 'root'
})
export class EstacionesService {

  url: any = url()

  constructor(private http: HttpClient) { }

  getEstaciones(): Observable<any> {
    return this.http.get(this.url+`estacion`, {observe: 'response'});
  }

  getPuestos(estacion: string|null): Observable<any> {
    return  this.http.get(this.url+`puesto/?estacion=${estacion}&ordering=id`);
  }

  updatePuesto(idPuesto: string|null, puesto: any): Observable<any> {
    return this.http.put(this.url+`puesto/${idPuesto}/`, puesto);
  }

  estadisticas_estaciones(): Observable<any> {
    return this.http.get(this.url+`estacion/estadisticas_estaciones/`, {observe: 'response'})
  }

}
