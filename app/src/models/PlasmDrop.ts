import BigNumber from 'bignumber.js';
import { femtoToPlm } from '../helpers/plasmUtils';

export class PlmDrop {
    basePlm: BigNumber;
    introducerBonuses: BigNumber[];
    affiliationRefs: string[];

    constructor(basePlm: BigNumber, introducerBonuses: BigNumber[], affiliationRefs: string[]) {
        this.basePlm = basePlm;
        this.introducerBonuses = introducerBonuses;
        this.affiliationRefs = affiliationRefs;
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
}
