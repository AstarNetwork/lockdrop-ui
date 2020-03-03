import { IonSelect, IonSelectOption } from '@ionic/react';
import React from 'react';

// option data is the type that is going to be passed to the component
export type OptionData = {
    dataSets: OptionItem[];
    onChoose: Function;
};

// option item type is used to provide the data for dropdown items
export type OptionItem = {
    label: string; // the dropdown display label
    value: number | string; // dropdown select return value
};

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
