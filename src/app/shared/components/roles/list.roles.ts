import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { PaginatorModule } from 'primeng/paginator';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { finalize } from 'rxjs';
import { MessageModule } from 'primeng/message';
import { RolePermissionsModal } from './frame.rpermissions';

import { showLoading } from '../utils';
import { UserService } from '../../services/user.service';
import { RolesService } from '../../services/roles.service';


interface Column {
    field: string
    header: string
    customExportHeader?: string
}

interface ExportColumn {
    title: string
    dataKey: string
}

@Component({
    selector: 'list-roles',
    imports: [DialogModule, MessageModule, RolePermissionsModal, ButtonGroupModule, ConfirmDialogModule, TableModule, SelectModule, ToastModule, InputIconModule, InputTextModule, IconFieldModule, DataViewModule, RippleModule, ButtonModule, CommonModule, Tag, FormsModule, ReactiveFormsModule, PaginatorModule],
    providers: [ConfirmationService, MessageService],
    styleUrls: [],
    standalone: true,

    template: `
    <p-toast></p-toast>
    <p-table [value]="roles()"  [columns]="cols" csvSeparator=";" [exportHeader]="'customExportHeader'" stripedRows selectionMode="multiple" [(selection)]="selectedUsers" dataKey="id" [tableStyle]="{ 'min-width': '50rem', 'margin-top':'10px' }"
        #dt
        [rows]="10"
        [globalFilterFields]="['title']"
        [rowHover]="true"
        dataKey="id"
    >
        <ng-template #caption>
            <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-bold">Cargos</span>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">

                <p-iconfield>
                    <p-inputicon styleClass="pi pi-search" />
                    <input [(ngModel)]="nameSearch" pInputText type="text" (input)="onGlobalFilter($event)" placeholder="Nome do usuário..." />
                </p-iconfield>

            </div>
            <div class="text-end pb-4 mt-2">
                <p-button icon="pi pi-external-link" label="Exportar CSV" (click)="dt.exportCSV()" />
            </div>

        </ng-template>

        <ng-template #header>
            <tr>
                <th>Cód. Função</th>

                <th pSortableColumn="name">
                    Nome
                    <p-sortIcon field="name" />
                </th>

                <th></th>
            </tr>
        </ng-template>
        <ng-template #body let-role>
            <tr [pSelectableRow]="role">
                <td>
                    {{ role.id }}
                </td>

                <td>
                    {{ role.name }}
                </td>

                <td>

                    <p-buttongroup>
                        <p-button (click)="updateRole(role.id, role.name)" icon="pi pi-pencil" severity="contrast" rounded/>
                        <p-button (click)="openRolePermissionsModal(role.id, role.name)" icon="pi pi-key" severity="contrast" rounded/>
                        <p-button (click)="deleteRole(role.id, role.name)" icon="pi pi-trash" severity="contrast" rounded/>
                    </p-buttongroup>
                </td>
            </tr>
        </ng-template>
    </p-table>

    <p-dialog [(visible)]="rDialog" header="Atualizar nome de cargo" [modal]="true">
        <ng-template #content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" style='margin-bottom: 4rem;'>
            <button id="btn_submit" style='display:none;' type="submit"></button>

            <div class='row'>
                <div class='col-md-12'>
                <label for="Name" class="block font-bold mb-3">Nome</label>
                <input formControlName="Name" class="w-full md:w-[30rem] mb-2" type="text" pInputText id="Type" required autofocus fluid />
                    <div class="error-feedback" *ngIf="hasBeenSubmited('Name')">
                        <p-message styleClass="mb-2" *ngIf="form.controls.Name.hasError('required')" severity="error" variant="simple" size="small">Por favor, digitar um nome</p-message>
                    </div>
                </div>
            </div>


        </form>


        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
            <p-button [disabled]="isLoading" (click)="submit()" type="submit" label="Salvar" icon="pi pi-check" />
        </ng-template>

        </ng-template>
    </p-dialog>

    <p-paginator (onPageChange)="onPageChange($event)"
        [first]="first"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Total: {totalRecords} | Mostrando {first} de {last}"
        [rows]="limitPerPage"
        [totalRecords]="totalRecords"
     />

    <p-confirmdialog
        [rejectLabel]="rejectLabel"
        [acceptLabel]="confirmLabel"
        [acceptAriaLabel]="confirmLabel"
        [rejectAriaLabel]="rejectLabel"
        [style]="{ width: '450px' }"
    />

    <open-role-permissions #roleModal title="Cargo"/>
    `,
})
export class ListRolesComponent {
    constructor(
        private messageService: MessageService,
        public formBuilder: FormBuilder,
        private confirmationService: ConfirmationService,
        private rolesService: RolesService
    ) { }

    @Input() roles: any
    @Input() totalRecords: any
    @Input() limitPerPage: any
    @ViewChild('roleModal') roleModal!: RolePermissionsModal

    form = this.formBuilder.group({
        Name: ['', [Validators.required]],
    })

    submitted: boolean = false
    rDialog: boolean = false
    isLoading: boolean = false
    typingTimeout: any
    curPage = 1
    first = 1

    id: string = ""

    selectedUsers!: any[] // does nothing for now
    nameSearch: string = ""

    cols!: Column[]
    exportColumns!: ExportColumn[]

    confirmLabel = "Confirmar"
    rejectLabel = "Cancelar"

    onPageChange(e: any) {
        this.loadRoles(e.page)
        this.curPage = e.page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    ngOnInit() {
        this.cols = [
            { field: 'id', header: 'Cód' },
            { field: 'name', header: 'Cargo' },
        ]

        

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }))
    }

    openRolePermissionsModal = (id: number, roleName: string) => {// arrow function so that when i reference this function somewhere, it maintains the correct 'this' internal reference
        this.roleModal.showRole(id.toString(), roleName)
    } 

    loadRoles(page: number, isDelete = false) {
        if (!isDelete) page++
        const rmLoading = showLoading()

        this.rolesService.getRoles(page, this.limitPerPage, this.nameSearch, "N").pipe(finalize(() => { rmLoading() })).subscribe({
            next: (res: any) => {
                this.roles.set(res.data ?? [])
                this.totalRecords = res.totalRecords
                this.first = 1

            },
            error: (err) => {
                if (err.status) {
                    this.messageService.add({ severity: 'error', summary: "Erro", detail: 'Ocorreu um erro ao buscar cargos.' });
                }
                this.isLoading = false
            },
        })
    }

    deleteRole(id: string, cargo: string) {
        this.confirmationService.confirm({
            message: 'Confirma excluír o cargo ' + `<mark>${cargo}</mark>` + ' ?',
            header: 'Confirmação',
            icon: 'pi pi-exclamation-triangle',
            closeOnEscape: true,
            rejectButtonProps: {
                label: 'Cancelar',
                severity: 'secondary',
                outlined: true,
            },
            acceptButtonProps: {
                label: 'Confirmar',
                severity: 'danger',
                outlined: true,
            },
            accept: () => {

                this.rolesService.deactivateRole(id).pipe(finalize(() => { })).subscribe({
                    next: (res: any) => {
                        this.loadRoles(this.curPage, true)
                        this.messageService.add({ severity: 'success', summary: "Sucesso", detail: 'Cargo excluído com sucesso' });
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: "Erro", detail: "Ocorreu um erro ao tentar excluír o cargo." });
                    },
                })
            }
        })
    }

    onSubmit() {
        this.submitted = true

        if (this.form.valid) {
            this.isLoading = true

            this.rolesService.updateRole(this.id, this.form.value).subscribe({
                next: (res: any) => {
                    this.messageService.add({ severity: 'success', summary: "Sucesso", detail: 'Cargo atualizado com sucesso' });
                    this.loadRoles(this.curPage, true)
                    this.submitted = false
                    this.isLoading = false
                    this.hideDialog()
                    this.form.reset()
                },
                error: (err) => {
                    this.rDialog = false
                    this.messageService.add({ severity: 'error', summary: "Erro", detail: 'Ocorreu um erro com sua requisição.' });
                    this.isLoading = false
                },

            })
        }
    }

    updateRole(id: string, _name: string) {
        this.submitted = false
        this.rDialog = true

        this.id = id

        this.form = this.formBuilder.group({
            Name: [_name, [Validators.required]],
        })
    }

    onGlobalFilter(event: any) {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout)
        }

        this.typingTimeout = setTimeout(() => {
            this.first = 0;
            this.curPage = 1;
            this.loadRoles(0)
        }, 500)
    }

    submit() {
        document.getElementById(`btn_submit`)?.click()
    }
    
    getSeverity(_user: any) {
        if (_user.active == `Y`) {
            return "success"
        } else {
            return "danger"
        }
    }

    getUserActiveState(_user: any) {
        if (_user.active == `Y`) {
            return "Ativo"
        } else {
            return "Inativo"
        }
    }

    hideDialog(){
        this.rDialog = false
    }

    hasBeenSubmited(controlName: string): boolean {
        const control = this.form.get(controlName)
        return Boolean(control?.invalid)
            && (this.submitted || Boolean(control?.touched))
        //|| Boolean(control?.dirty
    }
}
