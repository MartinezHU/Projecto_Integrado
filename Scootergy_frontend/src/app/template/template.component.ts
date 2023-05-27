import {Component, OnInit} from '@angular/core';
import {PerfilService} from "../perfil.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent implements OnInit {

  public usuario: any = {};

  constructor(
    private perfilService: PerfilService,
    private router: Router,
  ) {}

  ngOnInit() {

    this.usuario = JSON.parse(localStorage.getItem('userData')!).username

  }

  logOut(): void {
    localStorage.removeItem("userData");
    this.router.navigateByUrl("/login").then(r => {})
  }

}
