# CarbonKey

CarbonKey is used in conjuction with Carbon Wallet https://carbonwallet.com to create secure 2 of 2 multi signature bitcoin wallets where you are in charge of your private keys.

<table>
<tr>
<td><img src="https://raw.githubusercontent.com/onchain/CarbonKey/master/img/images_for_readme/main-screen.png" width="95%"></td>
<td><img src="https://raw.githubusercontent.com/onchain/CarbonKey/master/img/images_for_readme/backup.png" width="95%"></td>
<td><img src="https://raw.githubusercontent.com/onchain/CarbonKey/master/img/images_for_readme/backup-recovery.png" width="95%"></td>
<td><img src="https://raw.githubusercontent.com/onchain/CarbonKey/master/img/images_for_readme/bitid.png" width="95%"></td>
</tr>
</table>

# Debugging

From the browser console the following are useful.

injector = angular.element(document.body).injector()

onchain = injector.get('onChainService')

bitid = injector.get('bitIDService')

You can then call the various methods on the services.



