import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
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
import { ToastModule } from 'primeng/toast';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { finalize } from 'rxjs';
import { MessageModule } from 'primeng/message';
import { InputNumberModule } from 'primeng/inputnumber';

import { SelectItem, showLoading } from '../utils';
import { UserService } from '../../services/user.service';
import { EngineService } from '../../services/engine.service';


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
    selector: 'list-engines',
    imports: [DialogModule, MessageModule, InputNumberModule, ButtonGroupModule, ConfirmDialogModule, TableModule, SelectModule, ToastModule, InputIconModule, InputTextModule, IconFieldModule, DataViewModule, RippleModule, ButtonModule, CommonModule, Tag, FormsModule, ReactiveFormsModule, PaginatorModule],
    providers: [ConfirmationService, MessageService],
    styleUrls: [],
    standalone: true,

    template: `
    <p-toast></p-toast>
    <p-table [value]="engines()"  [columns]="cols" csvSeparator=";" [exportHeader]="'customExportHeader'" stripedRows selectionMode="multiple" [(selection)]="selectedUsers" dataKey="id" [tableStyle]="{ 'min-width': '50rem', 'margin-top':'10px' }"
        #dt
        [rows]="10"
        [globalFilterFields]="['model']"
        [rowHover]="true"
        dataKey="id"
    >
    <ng-template #caption>
    <div class="flex items-center justify-between mb-4">
        <span class="text-xl font-bold">Motores</span>
    </div>

    <div class="flex flex-wrap items-center justify-end gap-2">

    <p-iconfield>
        <p-inputicon styleClass="pi pi-search" />
        <input [(ngModel)]="nameSearch" pInputText type="text" (input)="onGlobalFilter($event)" placeholder="Modelo..." />
    </p-iconfield>


    <p-iconfield>
    <p-select [options]="userStates" [(ngModel)]="selectedUserState" optionLabel="name" (onChange)="onGlobalFilter($event)" class="w-full md:w-56" />
    </p-iconfield>
    </div>
    <div class="text-end pb-4 mt-2">
    <p-button icon="pi pi-external-link" label="Exportar CSV" (click)="dt.exportCSV()" />
    </div>

    </ng-template>

    <ng-template #header>
        <tr>
            <th pSortableColumn="model">
                Modelo
                <p-sortIcon field="model" />
            </th>
            <th>Tipo</th>
            <th>Potência</th>
            <th pSortableColumn="active">
                Ativo
                <p-sortIcon field="active" />
            </th>
            <th></th>
        </tr>
    </ng-template>
    <ng-template #body let-eng>
    <tr [pSelectableRow]="eng">
        <td>
            {{ eng.model }}
        </td>

        <td>
            {{ eng.type == 'P' ? 'Popa' : 'Centro' }}
        </td>

        <td>
            {{ eng.power }}
        </td>

        <td>
            <p-tag
            [value]="getActiveState(eng)"
            [severity]="getSeverity(eng)"
            styleClass="dark:!bg-surface-900"
            />
        </td>

        <td>
            <p-buttongroup>
                <p-button (click)="openNew(eng.id)" icon="pi pi-pencil" severity="contrast" rounded/>
                <p-button (click)="deactivateEngine(eng.id, eng.model)" icon="pi pi-trash" severity="contrast" rounded/>
            </p-buttongroup>
        </td>
    </tr>
    </ng-template>
    </p-table>

    <p-dialog [(visible)]="engineDialog" header="Registrar motor" [style]="{width: '900px'}" [modal]="true">
        <ng-template #content>
            <form [formGroup]="form" (ngSubmit)="onSubmit()" style='margin-bottom: 4rem;'>
                <button id="btn_submit" style='display:none;' type="submit"></button>


                <div class='row'>
                    <div class='col-md-8'>
                        <label for="Model" class="block font-bold mb-3">Modelo</label>
                        <input formControlName="Model" class="w-full md:w-[30rem] mb-2" type="text" pInputText id="Type" required autofocus fluid />
                        
                        <div class="error-feedback" *ngIf="hasBeenSubmited('Model')">
                            <p-message styleClass="mb-2" *ngIf="form.controls.Model.hasError('required')" severity="error" variant="simple" size="small">Por favor, digitar o modelo do motor</p-message>
                        </div>
                    </div>

                    <div class='col-md-4'>
                        <label for="Model" class="block font-bold mb-3">Preço</label>

                        <p-inputnumber formControlName="SellingPrice" class="w-full mb-2" mode="currency" currency="BRL" locale="pt-BR" />

                        <div class="error-feedback" *ngIf="hasBeenSubmited('SellingPrice')">
                            <p-message styleClass="mb-2" *ngIf="form.controls.SellingPrice.hasError('required')" severity="error" variant="simple" size="small">Por favor, digitar o preço de venda</p-message>
                        </div>
                    </div>
                </div>

                <div class='row'>
                    <div class='col-md-6'>
                        <label for="Model" class="block font-bold mb-3">Propulsão</label>

                        <p-select [invalid]="isInvalid('Propulsion')" [options]="propulsions" formControlName="Propulsion" optionLabel="name" placeholder="Selecione uma propulsão" class="w-full mb-2" />
                        @if (isInvalid('Propulsion')) {
                            <p-message severity="error" size="small" variant="simple">Por favor, selecione uma propulsão    </p-message>
                        }
                    </div>

                    <div class='col-md-6'>
                        <label for="Type" class="block font-bold mb-3">Tipo</label>

                        <p-select [invalid]="isInvalid('Type')" [options]="types" formControlName="Type" optionLabel="name" placeholder="Selecione um tipo" class="w-full mb-2" />
                        @if (isInvalid('Type')) {
                            <p-message severity="error" size="small" variant="simple">Por favor, selecione um tipo  </p-message>
                        }
                    </div>

                </div>

                <div class='row'>
                    <div class='col-md-6'>
                        <label for="Command" class="block font-bold mb-3">Comando</label>

                        <p-select [invalid]="isInvalid('Command')" [options]="commands" formControlName="Command" optionLabel="name" placeholder="Selecione um comando" class="w-full mb-2" />
                        @if (isInvalid('Command')) {
                            <p-message severity="error" size="small" variant="simple">Por favor, selecione um comando  </p-message>
                        }
                    </div>

                    <div class='col-md-6'>
                        <label for="FuelType" class="block font-bold mb-3">Combustível</label>

                        <p-select [invalid]="isInvalid('FuelType')" [options]="fuels" formControlName="FuelType" optionLabel="name" placeholder="Selecione um tipo" class="w-full mb-2" />
                        @if (isInvalid('FuelType')) {
                            <p-message severity="error" size="small" variant="simple">Por favor, selecione um tipo  </p-message>
                        }
                    </div>

                </div>
    
                <div class='row'>
                    <div class='col-md-6'>
                        <label for="Tempo" class="block font-bold mb-3">Tempo</label>

                        <p-select [invalid]="isInvalid('Tempo')" [options]="tempos" formControlName="Tempo" optionLabel="name" placeholder="Selecione um tipo" class="w-full mb-2" />
                        @if (isInvalid('Tempo')) {
                            <p-message severity="error" size="small" variant="simple">Por favor, selecione um tipo  </p-message>
                        }
                    </div>


                </div>


    
                <div class='row'>
                    <div class='col-md-4'>
                        <label for="Model" class="block font-bold mb-3">Peso </label>
                        <p-inputnumber formControlName="Weight" suffix=" KG" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="5" class="w-full mb-2" locale="pt-BR" />

                        <div class="error-feedback" *ngIf="hasBeenSubmited('Weight')">
                            <p-message styleClass="mb-2" *ngIf="form.controls.Weight.hasError('required')" severity="error" variant="simple" size="small">Por favor, digitar o preço de venda</p-message>
                        </div>
                    </div>

                    <div class='col-md-4'>
                        <label for="Rotation" class="block font-bold mb-3">Rotações</label>
                        <input formControlName="Rotation" class="w-full md:w-[30rem] mb-2" type="text" pInputText id="Type" required autofocus fluid />

                    </div>

                    <div class='col-md-4'>
                        <label for="Power" class="block font-bold mb-3">Potência</label>
                        <p-inputnumber formControlName="Power" [useGrouping]="false" class="w-full mb-2"  />

                        <div class="error-feedback" *ngIf="hasBeenSubmited('Power')">
                            <p-message styleClass="mb-2" *ngIf="form.controls.Power.hasError('required')" severity="error" variant="simple" size="small">Por favor, digitar o valor da potência</p-message>
                        </div>
                    </div>

                </div>

                <div class='row'>
                    <div class='col-md-4'>
                        <label for="Cylinders" class="block font-bold mb-3">Cilindro</label>
                        <p-inputnumber formControlName="Weight" [useGrouping]="false" class="w-full mb-2"  />

                        <div class="error-feedback" *ngIf="hasBeenSubmited('Cylinders')">
                            <p-message styleClass="mb-2" *ngIf="form.controls.Cylinders.hasError('required')" severity="error" variant="simple" size="small">Por favor, digitar o valor dos cilindros</p-message>
                        </div>
                    </div>

                    <div class='col-md-4'>
                        <label for="Clocks" class="block font-bold mb-3">Relógio</label>
                        <p-inputnumber formControlName="Clocks" [useGrouping]="false" class="w-full mb-2"  />

                        <div class="error-feedback" *ngIf="hasBeenSubmited('Clocks')">
                            <p-message styleClass="mb-2" *ngIf="form.controls.Clocks.hasError('required')" severity="error" variant="simple" size="small">Por favor, digitar o valor dos relógios</p-message>
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
    `,
})
export class ListEnginesComponent {
    constructor(
        public formBuilder: FormBuilder,
        private router: Router,
        private messageService: MessageService,
        private userService: UserService,
        private engineService: EngineService,
        private confirmationService: ConfirmationService
    ) { }

    @Input() engines: any
    @Input() totalRecords: any
    @Input() limitPerPage: any

    _id: string = ""

    submitted: boolean = false
    engineDialog: boolean = false
    isLoading: boolean = false
    typingTimeout: any
    curPage = 1
    first = 1

    propulsions: SelectItem[] = [
        { name: 'Padrão', code: 'PD' },
        { name: 'Helice', code: 'HE' },
        { name: 'Hidrojato', code: 'HJ' },
    ]

    tempos: SelectItem[] = [
        { name: '2', code: '2' },
        { name: '4', code: '4' },
    ]

    fuels: SelectItem[] = [
        { name: 'Diesel', code: 'D' },
        { name: 'Gasolina', code: 'G' },
    ]

    types: SelectItem[] = [
        { name: 'Centro', code: 'C' },
        { name: 'Popa', code: 'P' },
    ]

    commands: SelectItem[] = [
        { name: 'Cabo', code: 'C' },
        { name: 'Eletrônico', code: 'E' },
    ]

    form = this.formBuilder.group({
        Model: ['', [Validators.required]],
        SellingPrice: [0, [Validators.required]],
        Type: ['', [Validators.required]],
        Propulsion: ['', [Validators.required]],
        Weight: [0],
        Rotation: [''],
        Power: [0],
        Cylinders: [0],
        Command: ['', [Validators.required]],
        Clocks: [0],
        Tempo: [0, [Validators.required]],
        FuelType: ['', [Validators.required]],
    })

    selectedUsers!: any[] // does nothing for now

    selectedUserState: SelectItem | undefined = { name: "Indiferente", code: "" }
    userStates: SelectItem[] | undefined
    autoFilteredValue: any[] = []

    nameSearch: string = ""
    statusSearch: string = ""

    cols!: Column[];
    exportColumns!: ExportColumn[];

    confirmLabel = "Confirmar"
    rejectLabel = "Cancelar"

    onPageChange(e: any) {
        this.loadEngines(e.page)
        this.curPage = e.page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    ngOnInit() {
        this.userStates = [
            { name: "Indiferente", code: "" },
            { name: "Ativo", code: "Y" },
            { name: "Não ativo", code: "N" },
        ]

        this.cols = [
            { field: 'model', header: 'Modelo' },
            { field: 'type', header: 'Tipo' },
            { field: 'power', header: 'Potencia' },
        ]

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }))
    }

    loadEngines(page: number, isDelete = false) {
        if (!isDelete) page++

        this.engineService.getEngines(page, this.limitPerPage, this.nameSearch, this.selectedUserState?.code as string).pipe(finalize(() => { })).subscribe({
            next: (res: any) => {
                this.engines.set(res.data ?? [])
                this.totalRecords = res.totalRecords
                this.first = 1

            },
            error: (err) => {
                if (err.status) {
                    this.messageService.add({ severity: 'error', summary: "Erro", detail: 'Ocorreu um erro ao buscar motores.' });
                }
                this.isLoading = false
            },
        })
    }

    deactivateEngine(id: string, model: string) {
        this.confirmationService.confirm({
            message: 'Confirma desativar o motor ' + `<mark>${model}</mark>` + ' ?',
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
                const rmLoading = showLoading()

                this.engineService.deactivateEngine(id).pipe(finalize(() => { rmLoading() })).subscribe({
                    next: (res: any) => {
                        this.loadEngines(this.curPage, true)
                        this.messageService.add({ severity: 'success', summary: "Sucesso", detail: 'Motor desativado com sucesso' })
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: "Erro", detail: "Ocorreu um erro ao tentar desativar o motor." })
                    },
                })
            }
        })
    }

    openNew(id: string) {
        this.submitted = false
        this.engineDialog = true

        this.engineService.getEngine(id).subscribe({
            next: (res: any) => {                
               
                if(res.data['type']?.trimEnd() == 'C'){
                //@ts-ignore
                    this.form.get("Type")?.setValue(this.types[0])
                } else {
                //@ts-ignore
                    this.form.get("Type")?.setValue(this.types[1])
                }

                if(res.data['propulsion'] == null) {
                    this.form.get("Propulsion")?.setValue(null)
                } else if(res.data['propulsion']?.trimEnd() == 'PD'){
                //@ts-ignore
                    this.form.get("Propulsion")?.setValue(this.propulsions[0])
                } else if (res.data['propulsion']?.trimEnd() == 'HE'){
                //@ts-ignore
                    this.form.get("Propulsion")?.setValue(this.propulsions[1])
                } else {
                //@ts-ignore
                    this.form.get("Propulsion")?.setValue(this.propulsions[2])
                }

                if(res.data['tempo'] == 2){
                //@ts-ignore
                    this.form.get("Tempo")?.setValue(this.tempos[0])
                } else {
                //@ts-ignore
                    this.form.get("Tempo")?.setValue(this.tempos[1])
                }

                if(res.data['fuel_type']?.trimEnd() == 'D'){
                //@ts-ignore
                    this.form.get("FuelType")?.setValue(this.fuels[0])
                } else {
                //@ts-ignore
                    this.form.get("FuelType")?.setValue(this.fuels[1])
                }

                if(res.data['command']?.trimEnd() == 'C'){
                //@ts-ignore
                    this.form.get("Command")?.setValue(this.commands[0])
                } else {
                //@ts-ignore
                    this.form.get("Command")?.setValue(this.commands[1])
                }

                //@ts-ignore
                this.form.get("Model")?.setValue(res.data['model'])
                this.form.get("Rotation")?.setValue(res.data['rotation'])
                this.form.get("Weight")?.setValue(res.data['weight'])
                this.form.get("Power")?.setValue(res.data['power'])
                this.form.get("Cylinders")?.setValue(res.data['cylinders'])
                this.form.get("SellingPrice")?.setValue(res.data['selling_price'])
                this.form.get("Clocks")?.setValue(res.data['clocks'])

                this._id = id
            }, 
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: "Erro", detail: 'Ocorreu um erro ao buscar o motor.' })
            },
        })
    }

    hideDialog() {
        this.engineDialog = false
        this.submitted = false
    }

    onSubmit(){
        this.submitted = true

        if (this.form.valid) { 
            this.isLoading = true

            //@ts-ignore
            if(this.form.value.Propulsion?.code == 'PD'){
                this.form.get("Propulsion")?.setValue('PD')
            //@ts-ignore
            } else if(this.form.value.Propulsion?.code == 'HE') {
                this.form.get("Propulsion")?.setValue('HE')
            } else {
                this.form.get("Propulsion")?.setValue('HJ')
            }

            //@ts-ignore
            if(this.form.value.Tempo?.code == 2){
                this.form.get("Tempo")?.setValue(2)
            } else {
                this.form.get("Tempo")?.setValue(4)
            }

            //@ts-ignore
            if(this.form.value.Type?.code == 'C'){
                this.form.get("Type")?.setValue('C')
            } else {
                this.form.get("Type")?.setValue('P')
            }

            //@ts-ignore
            if(this.form.value.FuelType?.code == 'D'){
                this.form.get("FuelType")?.setValue('D')
            } else {
                this.form.get("FuelType")?.setValue('G')
            }

            //@ts-ignore
            if(this.form.value.Command?.code == 'C'){
                this.form.get("Command")?.setValue('C')
            } else {
                this.form.get("Command")?.setValue('E')
            }

            this.engineService.updateEngine(this._id, this.form.value).subscribe({
                next: (res: any) => {
                    this.messageService.add({ severity: 'success', summary: "Sucesso", detail: 'Motor atualizado com sucesso' })
                    this.loadEngines(this.curPage, true)
                    this.submitted = false
                    this.isLoading = false
                    this.hideDialog()
                    this.form.reset()
                },
                error: (err: any) => {
                    if(false){
                    } else {
                        this.messageService.add({ severity: 'error', summary: "Erro", detail: 'Ocorreu um erro com sua requisição.' })
                    }
                    this.isLoading = false
                },
            
            })
        }
    }

    submit() {
        document.getElementById(`btn_submit`)?.click()
    }

    onGlobalFilter(event: any) {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout)
        }

        this.typingTimeout = setTimeout(() => {
            this.first = 
            this.curPage = 1
            this.loadEngines(0)
        }, 500)
    }

    getSeverity(_engine: any) {
        if (_engine.active == `Y`) {
            return "success"
        } else {
            return "danger"
        }
    }

    getActiveState(_engine: any) {
        if (_engine.active == `Y`) {
            return "Ativo"
        } else {
            return "Inativo"
        }
    }

    hasBeenSubmited(controlName: string): boolean {
        const control = this.form.get(controlName)
        return Boolean(control?.invalid)
            && (this.submitted || Boolean(control?.touched))
        //|| Boolean(control?.dirty
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && (control.touched || this.submitted)
    }
}
