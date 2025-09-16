const arr = [1,2,3,6,8,10,15];
const diff = 4;


function findpairswithDifference(arr, diff) {
    const pairs = [];
    for (let i=0; i < arr.length; i++) {
        for (let j= i+1; j < arr.length ; j++) {
            if(Math.abs(arr[i] - arr[j]) === diff ) {
                pairs.push([arr[i] , arr[j]]);
            }
        }
    }

    return pairs

}

const result = findpairswithDifference(arr,diff)


console.log(result)