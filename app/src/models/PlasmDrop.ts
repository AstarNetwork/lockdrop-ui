import BigNumber from 'bignumber.js';
import { femtoToPlm } from '../helpers/plasmUtils';
import { LockEvent } from './LockdropModels';

export class PlmDrop {
    basePlm: BigNumber;
    introducerBonuses: BigNumber[];
    affiliationRefs: string[];
    locks: LockEvent[];

    constructor(basePlm: BigNumber, introducerBonuses: BigNumber[], affiliationRefs: string[], locks: LockEvent[]) {
        this.basePlm = basePlm;
        this.introducerBonuses = introducerBonuses;
        this.affiliationRefs = affiliationRefs;
        this.locks = locks;
    }

    getTotalToken() {
        let totalIntroBonuses = new BigNumber(0);

        for (let i = 0; i < this.introducerBonuses.length; i++) {
            totalIntroBonuses = totalIntroBonuses.add(this.introducerBonuses[i]);
        }

        const affBonus = this.basePlm.mul(0.01).mul(this.affiliationRefs.length);

        return this.basePlm
            .add(totalIntroBonuses)
            .add(affBonus)
            .toFixed();
    }

    getTotalPlm() {
        return femtoToPlm(new BigNumber(this.getTotalToken())).toFixed();
    }

    // calculate the number of PLM you get for being affiliated
    calculateAffBonus() {
        return this.basePlm.mul(this.affiliationRefs.length).mul(0.01);
    }

    // the number of PLM you get for referencing an affiliate
    calculateIntroBonus() {
        const introVal = new BigNumber(0);
        for (let i = 0; i < this.introducerBonuses.length; i++) {
            introVal.add(this.introducerBonuses[i]);
        }
        return introVal;
    }
}
