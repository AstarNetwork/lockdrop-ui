import { IonSelect, IonSelectOption } from '@ionic/react';
import React from 'react';
import { OptionData } from '../types/LockdropModels';

// react function component for making dropdown with the given items
export const DropdownOption = (props: OptionData) => {
    const items = props.dataSets.map(x => {
        return (
            <IonSelectOption className="dropdown-item" key={props.dataSets.indexOf(x)} value={x.value}>
                {x.label}
            </IonSelectOption>
        );
    });

    return (
        <IonSelect interface="popover" onIonChange={e => props.onChoose(e)}>
            {items}
        </IonSelect>
    );
};
