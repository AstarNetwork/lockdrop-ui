import BigNumber from 'bignumber.js';

export function femtoToPlm(femto: BigNumber) {
    const plmDenominator = new BigNumber(10).pow(-15);
    return femto.mul(plmDenominator);
}

export function lockDurationToRate(duration: number) {
    if (duration < 30) {
        return 0;
    } else if (duration < 100) {
        return 24;
    } else if (duration < 300) {
        return 100;
    } else if (duration < 1000) {
        return 360;
    } else {
        return 1600;
    }
}
