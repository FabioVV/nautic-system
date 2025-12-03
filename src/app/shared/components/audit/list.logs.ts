import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { PaginatorModule } from 'primeng/paginator';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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

import { SelectItem, showLoading } from '../utils';
import { User, UserService } from '../../services/user.service';
import { LogsService } from '../../services/logs.service';


interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'list-logs',
    imports: [DialogModule, ButtonGroupModule, ConfirmDialogModule, TableModule, SelectModule, ToastModule, InputIconModule, InputTextModule, IconFieldModule, DataViewModule, RippleModule, ButtonModule, CommonModule, Tag, FormsModule, ReactiveFormsModule, PaginatorModule],
    providers: [ConfirmationService, MessageService],
    styleUrls: [],
    standalone: true,

    template: `
    <p-toast></p-toast>
    <p-table [value]="logs()"  [columns]="cols" csvSeparator=";" [exportHeader]="'customExportHeader'" stripedRows selectionMode="multiple" [(selection)]="selectedUsers" dataKey="id" [tableStyle]="{ 'min-width': '50rem', 'margin-top':'10px' }"
        #dt
        [rows]="10"
        [globalFilterFields]="['title']"
        [rowHover]="true"
        dataKey="id"
    >
        <ng-template #caption>
            <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-bold">Logs</span>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">

                <p-iconfield>
                    <p-inputicon styleClass="pi pi-search" />
                    <input [(ngModel)]="descSearch" pInputText type="text" (input)="onGlobalFilter($event)" placeholder="Descrição da ação..." />
                </p-iconfield>

                <p-iconfield>
                    <p-inputicon styleClass="pi pi-search" />
                    <input [(ngModel)]="actionSearch" pInputText type="text" (input)="onGlobalFilter($event)" placeholder="Ação do usuário..." />
                </p-iconfield>


            </div>
            <div class="text-end pb-4 mt-2">
                <p-button icon="pi pi-external-link" label="Exportar CSV" (click)="dt.exportCSV()" />
            </div>

        </ng-template>

        <ng-template #header>
            <tr>
                <th pSortableColumn="action">
                    Ação
                    <p-sortIcon field="action" />
                </th>
                <th>URL</th>
                <th>Usuário</th>
                <th pSortableColumn="description">
                    Descrição da ação
                    <p-sortIcon field="description" />
                </th>
                <th pSortableColumn="created_at">
                   Data
                    <p-sortIcon field="created_at" />
                </th>
            </tr>
        </ng-template>
        <ng-template #body let-log>
            <tr [pSelectableRow]="log">
                <td>
                    {{ log.action }}
                </td>

                <td>
                    {{ log.url }}
                </td>

                <td>
                    {{ log.username }}
                </td>

                <td>
                    {{ log.description }}
                </td>
                <td>
                    {{ log.created_at | date:'dd/MM/yyyy HH:mm:ss' }}
                </td>
            </tr>
        </ng-template>
    </p-table>

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
export class ListLogsComponent {
    constructor(
        private router: Router,
        private messageService: MessageService,
        private userService: UserService,
        private logsService: LogsService,
        private confirmationService: ConfirmationService
    ) { }

    @Input() logs: any
    @Input() totalRecords: any
    @Input() limitPerPage: any

    isLoading: boolean = false
    typingTimeout: any
    curPage = 1
    first = 1

    selectedUsers!: any[] // does nothing for now

    autoFilteredValue: any[] = []

    actionSearch: string = ""
    descSearch: string = ""

    cols!: Column[];
    exportColumns!: ExportColumn[];

    confirmLabel = "Confirmar"
    rejectLabel = "Cancelar"

    onPageChange(e: any) {
        this.loadLogs(e.page)
        this.curPage = e.page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    ngOnInit() {
        this.cols = [
            { field: 'action', header: 'Ação' },
            { field: 'url', header: 'URL' },
            { field: 'username', header: 'Usuário' },
            { field: 'description', header: 'Descrição' },
            { field: 'created_at', header: 'Registrado em' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadLogs(page: number, isDelete = false) {
        if (!isDelete) page++
        const rmLoading = showLoading()

        this.logsService.getLogs(page, this.limitPerPage, this.descSearch, this.actionSearch).pipe(finalize(() => { rmLoading() })).subscribe({
            next: (res: any) => {
                this.logs.set(res.data ?? [])
                this.totalRecords = res.totalRecords
                this.first = 1

            },
            error: (err) => {
                if (err.status) {
                    this.messageService.add({ severity: 'error', summary: "Erro", detail: 'Ocorreu um erro ao buscar logs do sistema.' });
                }
                this.isLoading = false
            },
        })
    }

    onGlobalFilter(event: any) {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout)
        }

        this.typingTimeout = setTimeout(() => {
            this.first = 0;
            this.curPage = 1;
            this.loadLogs(0)
        }, 500)
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

}
