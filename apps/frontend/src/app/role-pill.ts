import { Component, Input } from '@angular/core'
import { MatChipsModule } from '@angular/material/chips'
import type { UserRole } from 'shared'

@Component({
  imports: [MatChipsModule],
  selector: 'app-role-pill',
  template: `
    <mat-chip
      class="role-chip"
      highlighted
      [class.role-chip--admin]="role === 'admin'"
      [class.role-chip--editor]="role === 'editor'"
      [class.role-chip--viewer]="role === 'viewer'"
    >
      {{ role }}
    </mat-chip>
  `,
  styles: `
    .role-chip {
      pointer-events: none;
      text-transform: capitalize;
      --mat-chip-container-height: 30px;
      --mat-chip-hover-state-layer-opacity: 0;
      --mat-chip-elevated-container-color: var(--mat-sys-surface-container-low);
      --mat-chip-elevated-selected-container-color: var(
        --mat-sys-surface-container-low
      );
      --mat-chip-label-text-color: var(--mat-sys-on-surface-variant);
      --mat-chip-selected-label-text-color: var(--mat-sys-on-surface-variant);
    }

    .role-chip--admin {
      --mat-chip-elevated-container-color: var(--mat-sys-tertiary-container);
      --mat-chip-elevated-selected-container-color: var(
        --mat-sys-tertiary-container
      );
      --mat-chip-label-text-color: var(--mat-sys-on-tertiary-container);
      --mat-chip-selected-label-text-color: var(
        --mat-sys-on-tertiary-container
      );
    }

    .role-chip--editor {
      --mat-chip-elevated-container-color: var(--mat-sys-primary-container);
      --mat-chip-elevated-selected-container-color: var(
        --mat-sys-primary-container
      );
      --mat-chip-label-text-color: var(--mat-sys-on-primary-container);
      --mat-chip-selected-label-text-color: var(--mat-sys-on-primary-container);
    }

    .role-chip--viewer {
      --mat-chip-elevated-container-color: var(--mat-sys-secondary-container);
      --mat-chip-elevated-selected-container-color: var(
        --mat-sys-secondary-container
      );
      --mat-chip-label-text-color: var(--mat-sys-on-secondary-container);
      --mat-chip-selected-label-text-color: var(
        --mat-sys-on-secondary-container
      );
    }
  `,
})
export class RolePill {
  @Input({ required: true }) role!: UserRole
}
