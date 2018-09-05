'use strict';

ittelApp.controller('mainController', function ($scope, $timeout, assetsService, jiraService, $http, $q) {

    console.log("main controller : assetsService = " + assetsService);

    var defaultTypeSortField = "name";
    var defaultItemSortField = "name";
    var defaultHistoryOrderField = "timestamp";

    $scope.orderpage = {
        typeField: defaultTypeSortField,
        itemField: defaultItemSortField
    }
    $scope.settings = null;
    $scope.historyFilter = null;

    $scope.currentHistoryFilter = "ALL";
    $scope.managers = [];


    $scope.historyOrderField = defaultHistoryOrderField;
    $scope.itemReverseSort = false;
    $scope.typeReverseSort = false;

    $scope.startItemIndex = 0;
    $scope.startTypeIndex = 0;
    $scope.typerecord = null;
    $scope.items = [];
    $scope.basket = [];
    $scope.types = [];

    $scope.order = [];
    $scope.orderItems = [];
    $scope.allitems = [];

    // currrent assets uds
    $scope.idSelectedType;
    $scope.idSelectedItem;
    $scope.itemManager = null;

    ///////////////////
    var TypeNameReg = /^([a-z]+.+)$/i;
    var ItemNameReg = /^([a-z]+.+)$/i;
    var ItemDescReg = /^[.+]{3,100}$/i;
    var maxNameLength = 45;
    var minNameLength = 3;

    $scope.authUser = null;

    $scope.show = {
        itemNumber: 100,
        typeNumber: 100
    };

    $scope.country = null;
    $scope.orderTypeId = null;
    $scope.orderItemId = null;


    var jira_url = "";
    var Errors = {
        JIRA_AUTH_ERROR: "Jira authentication error",
        CANNOT_GET_TYPE_RECORDS: "Unable to get type records",
        CANNOT_GET_ITEM_RECORDS: "Unable to get item records",
        TYPE_NOT_SAVED: "Type not saved",
        TYPE_NOT_UPDATED: "Type not updated",
        TYPE_RECORDS_NOT_UPDATED: "Type records not updated",
        TYPE_NOT_DELETED: "Type not deleted",
        TYPE_ALREADY_EXISTS: "Record already exists",
        TYPE_QUERY_ERROR: "Unable to query type",

        ITEM_RECORDS_NOT_UPDATED: "Certificate records not updated",
        ITEM_NOT_FOUND: "Item not found",
        ITEM_QUERY_ERROR: "Unable to query item",
        ITEM_ALREADY_EXISTS: "Item already exists",
        ITEM_NOT_SAVED: "Item not saved",
        ITEM_NOT_UPDATED: "Item not updated",
        ITEM_NOT_DELETED: "Item not deleted"

    };

    var Status = {
        Welcome: "Welcome to Tallink IT Tellimus!",
        Saved: "Successfully saved",
        Updated: "Successfully updated",
        Deleted: "Successfully deleted",
        Error: "Error"
    };

    var RecordStatus = {
        //&#10004;
        Exists: "Exists",
        Unknown: "Unknown",
        NotExists: "NotExists",
        Error: "Error"
    };

    var RecordClientState = {
        Default: 0,
        New: 0x1,
        Edit: 0x2,
        JustAdded: 0x4
    };

    $scope.view_tab = "orders";

    $scope.errorMessage = null;
    $scope.error = null;
    $scope.addedItemName = null;
    $scope.addedTypeName = null;

    $scope.statusMessage = Status.Welcome;

    var domainReg = /^([a-z0-9]+\.)?[a-z0-9\u00C0-\u017F][a-z0-9\u00C0-\u017F-]*\.[a-z-]{2,}$/i;

    var makeItemSort = function () {

        var name = $scope.orderpage.itemField;

        if (!name) {
            return;
        }
        //console.log("sort: " + name + ", reverse = " + $scope.dnsReverseSort);
        try {
            var sortname = $scope.itemReverseSort ? "-" + name : name;
            $scope.items.sort(dynamicSort(sortname));

        } catch (e) {
            console.log("sorting error");
        }
    }

    var makeTypeSort = function () {

        var name = $scope.orderpage.typeField;

        if (!name) {
            return;
        }

        try {
            var sortname = $scope.typeReverseSort ? "-" + name : name;
            $scope.types.sort(dynamicSort(sortname));

        } catch (e) {
            console.log("sorting error");
        }
    }

    var findNewItemRecord = function () {
        var res = null;
        for (var i = 0; i < $scope.items.length; i++) {
            var rec = $scope.items[i];
            if (rec.state & RecordClientState.New) {
                res = rec;
                break;
            }
        }
        return res;
    }

    var findNewTypeRecord = function () {
        var res = null;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            if (rec.state & RecordClientState.New) {
                res = rec;
                break;
            }
        }
        return res;
    }

    var findNewItemRecordIndex = function () {

        var res = -1;

        for (var i = 0; i < $scope.items.length; i++) {
            var rec = $scope.items[i];
            if (rec.state & RecordClientState.New) {
                res = i;
                break;
            }
        }

        return res;
    }
    var findNewTypeRecordIndex = function () {

        var res = -1;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            if (rec.state & RecordClientState.New) {
                res = i;
                break;
            }
        }
        return res;
    }

    var findBasketIndex = function (id) {
        var res = -1;
        for (var i = 0; i < $scope.basket.length; i++) {
            var rec = $scope.basket[i];
            if (rec.id == id) {
                return i;
            }
        }
        return res;
    }


    var removeNewDnsRecord = function () {

        var index = findNewDnsRecordIndex();

        if (index >= 0) {
            console.log("removing new item at " + index);
            $scope.dnsRecords.splice(index, 1);
        }
    }


    var restoreCursor = function () {
        document.body.style.cursor = "auto";
    }

    var setWaitCursor = function () {
        document.body.style.cursor = "wait";
    }

    var setLoading = function () {

        $("#loading").css("display", "block");
    }

    var stopLoading = function () {
        $("#loading").css("display", "none");
    }


    var getItemRecordByName = function (name) {

        var rec = null;
        for (var i = 0; i < $scope.items.length; i++) {
            var r = $scope.items[i];
            if (r.name == name) {
                rec = r;
                break;
            }
        }

        return rec;
    }

    var getTypeRecordByName = function (name) {

        var rec = null;

        for (var i = 0; i < $scope.types.length; i++) {
            var r = $scope.types[i];
            if (r.name == name) {
                rec = r;
                break;
            }
        }

        return rec;
    }

    var adjustItemPosition = function (name) {

        if (name == null) {
            return;
        }

        var rec = getItemRecordByName(name);

        if (rec == null) {
            return;
        }

        rec.state |= RecordClientState.JustAdded;

        $scope.startItemIndex = 0;
        var index = rec.id;
        var page = Math.ceil(index / $scope.show.itemNumber) - 1;
        $scope.startItemIndex = page * $scope.show.itemNumber;

    };

    var adjustTypePositionForRecord = function (name) {

        if (name == null) {
            return;
        }

        var rec = getTypeRecordByName(name);

        if (rec == null) {
            return;
        }

        if (defaultTypeSortField != $scope.orderpage.typeField) {
            makeTypetSort();
        }
        rec.state |= RecordClientState.JustAdded;

        $scope.startTypeIndex = 0;
        var index = rec.id;
        var page = Math.ceil(index / $scope.show.typeNumber) - 1;
        $scope.startTypeIndex = page * $scope.show.typeNumber;

    };


    var clearMessages = function () {

        $scope.error = null;
        $scope.errorMessage = null;
        $scope.statusMessage = null;
        $scope.addedItemName = null;
        $scope.addedTypeName = null;
    };


    $scope.onChangeHistoryFilter = function () {

        console.log("filter = " + $scope.currentHistoryFilter);

        $scope.updateActionHistory();

    }


    $scope.recordStyle = function (index) {

        var style = null;

        if (index % 2 == 0) {
            style = "background-color: #c0cbe2;";
        } else {
            style = "background-color: #e2edff;";
        }
        return style;
    }


    $scope.onDnsNavigateRight = function () {

        if (!$scope.dnsRecords) {
            return;
        }
        if ($scope.startDnsIndex + $scope.show.dnsNumber >= $scope.dnsRecords.length) {
            return;
        }
        $scope.startDnsIndex += $scope.show.dnsNumber;
    }

    $scope.onDnsNavigateLeft = function () {

        if (!$scope.dnsRecords) {
            return;
        }

        if ($scope.startDnsIndex == 0) {
            return;
        }

        $scope.startDnsIndex = $scope.startDnsIndex - $scope.show.dnsNumber;
        $scope.startDnsIndex = Math.max(0, $scope.startDnsIndex);
    };

    $scope.onChangeShowNumber = function () {

        console.log("onChangeShowNumber : " + $scope.show.dnsNumber);
    }



    $scope.onColumnSort = function (name) {
        $scope.dnsReverseSort = $scope.orderpage.dnsField == null ? false : !$scope.dnsReverseSort;
        $scope.orderpage.dnsField = name;
        makeDnsSort();
    }


    $scope.onHistorySort = function (name) {
        $scope.historyReverseSort = $scope.historyOrderField == null ? false : !$scope.historyReverseSort;
        $scope.historyOrderField = name;
        makeHistorySort();
    }

    $scope.onAddItemRecord = function () {
        console.log("adding item rec");

        var id = getItemMaxRecordId() + 1;
        $scope.items.push({
            id: id,
            name: '',
            description: '',
            needApprove: false,
            typeId: $scope.idSelectedType,
            state: RecordClientState.New

        });

        adjustItemPositionForAddition();
        var inputName = "#name" + id;

        waitForElementToDisplay(inputName, 200, setElementFocus);

        waitForElementToDisplay(inputName, 200, function () {
            $(inputName).attr("placeholder", "Enter name here");
        });

        var descCtrl = "#description" + id;
        waitForElementToDisplay(descCtrl, 100, function () {
            $(descCtrl).attr("placeholder", "Enter description here");
        });

        return false;
    }

    $scope.onAddTypeRecord = function () {
        console.log("adding Type rec");
        clearMessages();
        var id = getTypeMaxRecordId() + 1;
        $scope.types.push({
            id: id,
            name: '',
            description: '',
            state: RecordClientState.New
        });

        adjustTypePositionForAddition();
        var inputName = "#tname" + id;

        waitForElementToDisplay(inputName, 400, setElementFocus);

        waitForElementToDisplay(inputName, 200, function () {
            $(ctrl).focus();
            $(ctrl).attr("placeholder", "Enter name here");
        });

        return false;
    }

    $scope.isTypeUpdateState = function (id) {
        var rec = getTypeRecord(id);
        return rec != null && (!rec.state & RecordClientState.New);
    }

    $scope.isItemUpdateState = function (id) {
        var rec = getItemRecord(id);
        return rec != null && (!rec.state & RecordClientState.New);
    }


    $scope.isTypeDeleteAllowed = function (id) {
        var rec = getTypeRecord(id);
        return rec != null && (rec.state & RecordClientState.Edit);
    }

    $scope.isItemDeleteAllowed = function (id) {
        var rec = getItemRecord(id);
        return rec != null && (rec.state & RecordClientState.Edit);
    }


    $scope.isTypeNameSaveDisabled = function (id) {
        var res = false;
        var rec = getTypeRecord(id);
        if (!rec) return false;

        var name = rec.name;
        if (!name) return true;

        name = name.trim();
        if (name.length > maxNameLength ||
            name.length < minNameLength) return true;

        if (!name.match(TypeNameReg)) {
            return true;
        }
        return false;

    }

    $scope.isItemNameSaveDisabled = function (id) {
        var res = false;
        var rec = getItemRecord(id);
        if (!rec) return false;

        var name = rec.name;
        if (!name) return true;

        name = name.trim();

        if (name.length > maxNameLength ||
            name.length < minNameLength) return true;

        if (!name.match(ItemNameReg)) {
            return true;
        }
        return false;

    }

    $scope.isItemDescSaveDisabled = function (id) {
        var res = false;
        var rec = getItemRecord(id);
        if (!rec) return false;

        if (!rec.description) return true;

        var name = rec.description.trim();

        if (!name) return true;

        if (!name.match(ItemDescReg)) {
            return true;
        }

        return false;
    }

    $scope.isTypeEditState = function (id) {
        var res = false;
        var rec = getTypeRecord(id);
        if (rec.state != null) {
            if (rec.state & RecordClientState.New) {
                /*
                 var name = rec.name;
                 if (!checkUniqueTypeRecordByName(id, name)) {
                 $scope.error = Errors.ITEM_ALREADY_EXISTS;
                 $scope.errorMessage = name + " : " + Errors.ITEM_ALREADY_EXISTS;
                 return res;
                 }
                 */
                res = true;
            } else if (rec.state & RecordClientState.Edit) {
                res = true;
            }
        }
        return res;
    }

    $scope.isItemEditState = function (id) {
        var res = false;
        var rec = getItemRecord(id);
        if (rec.state != null) {
            if (rec.state & RecordClientState.New) {
                var name = rec.name;

                res = true;

            } else if (rec.state & RecordClientState.Edit) {
                res = true;
            }
        }
        return res;
    }

    $scope.isTypeNameEditAllowed = function (id) {
        var rec = getTypeRecord(id);
        return rec != null && (rec.state & RecordClientState.New || rec.state & RecordClientState.Edit);
    }

    $scope.isItemNameEditAllowed = function (id) {
        var rec = getItemRecord(id);
        return rec != null && (rec.state & RecordClientState.New || rec.state & RecordClientState.Edit);
    }


    $scope.statusStyle = function (status) {

        var style = null;
        if (status == RecordStatus.Exists) {
            style = "color: darkGreen; font-size: 1.2em";
        } else if (status == RecordStatus.Unknown) {
            style = "color: gold;";
        } else if (status == RecordStatus.NotExists) {
            style = "color: darkRed;";
        } else if (status == RecordStatus.Error) {
            style = "color: darkRed;";
        }

        return style;
    }

    $scope.dnsStatusDisplay = function (status) {

        var ret = null;
        if (status == RecordStatus.Exists) {
            ret = 'Ok!';
        } else if (status == RecordStatus.Unknown) {
            ret = status;
        } else if (status == RecordStatus.NotExists) {
            ret = status;
        } else if (status == RecordStatus.Error) {
            ret = status;
        }
        return ret;
    }

    $scope.certStatusDisplay = function (status) {

        var ret = null;
        if (status == RecordStatus.Exists) {
            ret = 'Ok!';
        } else if (status == RecordStatus.Unknown) {
            ret = status;
        } else if (status == RecordStatus.NotExists) {
            ret = status;
        } else if (status == RecordStatus.Error) {
            ret = status;
        }
        return ret;
    }


    $scope.onUpdateItemRecord = function (id) {

        var item = getItemRecord(id);
        if (!item.name) return;
        console.log("Updating DNS: " + item.name);

        clearMessages();
        enableItemControls(false);
        //makeProgress();
        $scope.statusMessage = Status.Updating + " " + item.name + "...";
        //setWaitCursor();
        setLoading();

        assetsService.updateItem(item).then(function (result) {

            var res = result;
            try {

                stopLoading();

                if (!res) {
                    console.log("No result");
                    return;
                }

                if (res.status == Status.Error) {
                    console.log("Error, record not updated: " + item.name);
                    $scope.error = Errors.ITEM_NOT_UPDATED;
                    $scope.errorMessage = res.message ? res.message :
                        (Errors.ITEM_NOT_UPDATED);
                    return;
                }

                //progressSuccess();
                $scope.updateClientRecords();

                console.log("Record updated ");
                $scope.statusMessage = item.name + ": " + Status.Updated;

            } finally {
                //restoreCursor();
                stopLoading();
                enableDnsControls(true);
            }


        }, function (error) {
            console.log("Error updating all records");
        });

    }


    var setElementFocus = function (element) {

        if (element.length) {
            element.get(0).focus();
        }

    }

    function waitForElementToDisplay(selector, time, callback) {

        window.setTimeout(function () {
            if ($(selector).length) {
                callback($(selector));
            } else {
                waitForElementToDisplay(selector, time, callback);
            }
        }, time)
    }

    $scope.onDeleteBasketItem = function (id) {
        var index = findBasketIndex(id);
        if (index >= 0) {
            console.log("removing basket item at " + index);
            $scope.basket.splice(index, 1);
        }

    }

    $scope.onDeleteItem = function (id) {

        var rec = getItemRecord(id);

        doConfirm("Delete record " + rec.name + " ?", function yes() {

            clearMessages();

            assetsService.deleteItem(rec).then(function (result) {
                var res = result;
                if (!res) {
                    console.log("No result");
                    return;
                }

                if (res.status == Status.Error) {

                    console.log("Error, DNS record not deleted: " + rec.name);
                    $scope.error = Errors.ITEM_NOT_DELETED;
                    $scope.errorMessage = res.message ? res.message :
                        (rec.name + ": " + Errors.ITEM_NOT_DELETED);

                    return;
                }

                $scope.statusMessage = rec.name + " : " + Status.Deleted;

                $scope.updateClientRecords();
                $scope.setSelectedType($scope.idSelectedType);


            }, function (errpr) {

                console.log("DNS record not deleted");
                $scope.error = Errors.ITEM_NOT_DELETED;
                $scope.errorMessage = error && error.message ? error.message : Errors.ITEM_NOT_DELETED;

            });
        });
    }

    $scope.onDeleteType = function (id) {

        var rec = getTypeRecord(id);

        doConfirm("Delete type record " + rec.name + " ?", function yes() {

            clearMessages();

            assetsService.deleteType(rec).then(function (result) {
                var res = result;
                if (!res) {
                    console.log("No result");
                    return;
                }

                if (res.status == Status.Error) {

                    console.log("Error, Type record not deleted: " + rec.name);
                    $scope.error = Errors.TYPE_NOT_DELETED;
                    $scope.errorMessage = res.message ? res.message :
                        (rec.name + ": " + Errors.TYPE_NOT_DELETED);

                    return;
                }

                $scope.statusMessage = rec.name + " : " + Status.Deleted;

                $scope.updateClientRecords();

            }, function (errpr) {

                console.log("Type record not deleted");
                $scope.error = Errors.TYPE_NOT_DELETED;
                $scope.errorMessage = error && error.message ? error.message : Errors.TYPE_NOT_DELETED;

            });
        });
    }

    $scope.isShowTypeRecord = function (index) {
        return index >= $scope.startTypeIndex && index < $scope.startTypeIndex + $scope.show.typeNumber;
    }

    $scope.isShowItemRecord = function (index) {

        return index >= $scope.startItemIndex && index < $scope.startItemIndex + $scope.show.itemNumber;

    }

    $scope.isShowHistoryRecord = function (index) {
        return true;
    }

    $scope.isItemDeleteState = function (id) {
        var rec = getItemRecord(id);
        return rec != null && (rec.state & RecordClientState.Edit);
    }



    $scope.isItemEditableInputDisabled = function (id) {
        var rec = getItemRecord(id);
        return rec == null || !(rec.state & RecordClientState.Edit || rec.state & RecordClientState.New);

    }

    $scope.isTypetEditableInputDisabled = function (id) {
        var rec = getTypeRecord(id);
        return rec == null || !(rec.state & RecordClientState.Edit || rec.state & RecordClientState.New);
    }

    $scope.isTypeStandardInputDisabled = function (id) {
        var rec = getTypeRecord(id);
        return rec == null || !rec.state & RecordClientState.Edit;
    }


    $scope.isTypeEditAllowed = function (id) {

        return true;
    }

    $scope.isItemEditAllowed = function (id) {

        return true;
    }

    $scope.isItemSaveAllowed = function (id) {

        var rec = getItemRecord(id);
        if (rec == null) {
            return false;
        }
        if (rec.name.trim().length == 0) {
            return false;
        }
        return true;
    }


    /*
     $scope.isDeleteAllowed = function (id) {
     var res = false;
     var rec = getRecord(id);
     if (rec.state != null) {
     if (rec.state == RecordClientState.New) {
     res = false;

     } else if (rec.state == RecordClientState.Edit) {
     res = true;
     }
     }
     return res;
     }
     */


    $scope.isTypeEditable = function (id) {
        var item = getTypeRecord(id);
        return item != null && (item.state == RecordClientState.Default || item.state & RecordClientState.JustAdded);
    }

    $scope.isItemEditable = function (id) {

        var item = getItemRecord(id);
        return item != null && (item.state == RecordClientState.Default || item.state & RecordClientState.JustAdded);
    }


    $scope.onEditTypeRecord = function (id) {

        console.log("Edit TYPE rec :" + id);
        var item = getTypeRecord(id);
        if (!item) return;

        item.state = RecordClientState.Edit;
        storeValues(id, ["tname"]);

        var ctrl = "#tname" + id;

        waitForElementToDisplay(ctrl, 200, function () {
            $(ctrl).focus();
            $(ctrl).attr("placeholder", "Enter name here");
        });

        return false;
    }

    $scope.onEditItemRecord = function (id) {

        console.log("Edit ITEM rec :" + id);
        var item = getItemRecord(id);
        if (!item) return false;

        item.state = RecordClientState.Edit;

        storeValues(id, ["name"]);

        var ctrl = "#name" + id;
        waitForElementToDisplay(ctrl, 200, function () {
            $(ctrl).focus();
            $(ctrl).attr("placeholder", "Enter name here");
        });

        return false;
    }


    $scope.onSaveTypeRecord = function (id) {

        clearMessages();

        console.log("Save type rec :" + id);
        var inputName = "#tname" + id;
        var name = $(inputName).val();
        console.log("name= " + name);

        var item = getTypeRecord(id);
        if (item == null) {
            return;
        }
        try {

            setLoading();

            if (item.state & RecordClientState.New) {

                assetsService.createType(item).then(function (result) {
                    try {
                        var res = result;
                        clearMessages();

                        if (!res) {
                            $scope.error = Errors.TYPE_QUERY_ERROR;
                            $scope.errorMessage = Errors.TYPE_QUERY_ERROR + ": " + name;

                            console.log("No result");
                            return;
                        }

                        if (res.status == Status.Error) {
                            console.log("Error, type not saved: " + name);
                            $scope.error = Errors.TYPE_NOT_SAVED;
                            $scope.errorMessage = res.message ? res.message : (Errors.TYPE_NOT_SAVED + ": " + name);
                            return;
                        }

                        $scope.addedTypeName = item.name;
                        $scope.updateClientRecords();
                        $scope.statusMessage = item.name + " : " + Status.Saved;

                    } finally {
                        stopLoading();
                    }


                }, function (error) {
                    console.log("TYPE record not saved");
                    $scope.error = Errors.TYPE_NOT_SAVED;
                    $scope.errorMessage = error && error.message ? error.message : Errors.TYPE_NOT_SAVED;
                    stopLoading();
                });

            } else if (item.state & RecordClientState.Edit) {

                assetsService.updateType(item).then(function (result) {
                        try {
                            var res = result;
                            //$(inputName).prop('disabled', true);
                            if (!res) {
                                console.log("No result");
                                return;
                            }
                            if (res.status == Status.Error) {
                                console.log("Error, type record not updated: " + name);
                                $scope.error = Errors.TYPE_NOT_UPDATED;
                                $scope.errorMessage = res.message ? res.message :
                                    (Errors.TYPE_NOT_UPDATED + ": " + name);
                                restoreCursor();
                                return;
                            }
                            $scope.updateClientRecords();
                            $scope.statusMessage = item.name + " : " + Status.Updated;
                            console.log("Update result = " + res);

                        } finally {
                            stopLoading();
                        }


                    },

                    function (error) {

                        console.log("DNS record not saved : " + item.name);
                        $scope.error = Errors.TYPE_NOT_SAVED;
                        $scope.errorMessage = Errors.TYPE_NOT_SAVED + " : " + (error && error.message ? error.message : "");
                        stopLoading();
                    }
                );

            }

        } finally {

        }
    }

    $scope.onSaveItemApproveStatus = function (id) {

        var item = getItemRecord(id);
        if (item == null) {
            return;
        }
        item.needApprove = !item.needApprove;
///////////////
        setLoading();
        assetsService.updateItem(item).then(function (result) {
                try {
                    var res = result;
                    //$(inputName).prop('disabled', true);
                    if (!res) {
                        console.log("No result");
                        return;
                    }
                    if (res.status == Status.Error) {
                        console.log("Error, item record not updated: " + name);
                        $scope.error = Errors.ITEM_NOT_UPDATED;
                        $scope.errorMessage = res.message ? res.message :
                            (Errors.ITEM_NOT_UPDATED + ": " + name);
                        restoreCursor();
                        return;
                    }
                    $scope.updateClientRecords();
                    $scope.setSelectedType($scope.idSelectedType);
                    $scope.statusMessage = item.name + " : " + Status.Updated;
                    console.log("Update result = " + res);

                } finally {
                    stopLoading();
                }


            },

            function (error) {

                console.log("Item record not saved : " + item.name);
                $scope.error = Errors.ITEM_NOT_SAVED;
                $scope.errorMessage = Errors.ITEM_NOT_SAVED + " : " + (error && error.message ? error.message : "");
                stopLoading();
            }
        );


////

    }
    $scope.onSaveItemRecord = function (id) {

        clearMessages();

        console.log("Save item rec :" + id);
        var inputName = "#name" + id;
        var name = $(inputName).val();
        console.log("name= " + name);

        var item = getItemRecord(id);
        if (item == null) {
            return;
        }
        try {

            setWaitCursor();

            if (item.state & RecordClientState.New) {

                assetsService.createItem(item).then(function (result) {
                    try {

                        var res = result;

                        clearMessages();

                        if (!res) {
                            $scope.error = Errors.ITEM_NOT_SAVED;
                            $scope.errorMessage = Errors.ITEM_NOT_SAVED + ": " + name;

                            console.log("No result");
                            return;
                        }

                        if (res.status == Status.Error) {
                            console.log("Error, item not saved: " + name);
                            $scope.error = Errors.ITEM_NOT_SAVED;
                            $scope.errorMessage = res.message ? res.message : (Errors.ITEM_NOT_SAVED + ": " + name);
                            return;
                        }

                        $scope.addedItemName = item.name;
                        $scope.updateClientRecords();

                        $scope.setSelectedType($scope.idSelectedType);

                        $scope.statusMessage = item.name + " : " + Status.Saved;

                    } finally {
                        restoreCursor();
                    }


                }, function (error) {
                    console.log("Item record not saved");
                    $scope.error = Errors.ITEM_NOT_SAVED;
                    $scope.errorMessage = error && error.message ? error.message : Errors.ITEM_NOT_SAVED;
                    restoreCursor();
                });

            } else if (item.state & RecordClientState.Edit) {

                assetsService.updateItem(item).then(function (result) {
                        try {
                            var res = result;
                            //$(inputName).prop('disabled', true);
                            if (!res) {
                                console.log("No result");
                                return;
                            }
                            if (res.status == Status.Error) {
                                console.log("Error, item record not updated: " + name);
                                $scope.error = Errors.ITEM_NOT_UPDATED;
                                $scope.errorMessage = res.message ? res.message :
                                    (Errors.ITEM_NOT_UPDATED + ": " + name);
                                restoreCursor();
                                return;
                            }
                            $scope.updateClientRecords();
                            $scope.setSelectedType($scope.idSelectedType);

                            $scope.statusMessage = item.name + " : " + Status.Updated;
                            console.log("Update result = " + res);

                        } finally {
                            restoreCursor();
                        }


                    },

                    function (error) {

                        console.log("Item record not saved : " + item.name);
                        $scope.error = Errors.ITEM_NOT_SAVED;
                        $scope.errorMessage = Errors.ITEM_NOT_SAVED + " : " + (error && error.message ? error.message : "");
                        restoreCursor();
                    }
                );

            }

        } finally {

        }
    }

    $scope.isItemNewAllowed = function () {

        if ($scope.idSelectedType == null) return false;

        var res = findNewItemRecord();
        return res == null;

    }

    $scope.isTypeNewAllowed = function () {

        if ($scope.types.length == 0) {
            return true;
        }
//        if (!isAdminUser()) {
//            return false;
//        }
        var res = findNewTypeRecord();
        return res == null;
    }

    var storeValues = function (id, names) {
        if (!names) return;

        names.forEach(function (name) {
            try {

                var ctrl = "#" + name + id;
                $(ctrl).data('oldval', $(ctrl).val());

            } catch (e) {
                console.log("err" + e.message);
            }
        });
    }


    $scope.updateClientRecords = function () {

        $scope.items = [];
        $scope.types = [];
        return $scope.getData();
    }


    $scope.getSettings = function () {

        console.log("getting settings");
        var defer = $q.defer();
        assetsService.getSettings().then(function (result) {

            $scope.settings = result;
            var managers = null;

            if (result.managers) {

                managers =
                    result.managers.split(",");

                $.each(managers, function (ind, rec) {
                    $scope.managers.push({
                        name: rec,
                        id: ++ind
                    })
                })

            }
            defer.resolve(result);
        });

        return defer.promise;

    };


    $scope.getData = function () {

        var res;
        var defer = $q.defer();
        assetsService.getTypes().then(function (result) {
            res = result;
            var records = result;
            if (!records) {
                console.log("No item records");
            }
            /*
             $scope.allitems = $scope.allitems.concat(records);

             $.each($scope.allitems, function (ind, rec) {
             if (!($scope.types.some(el => el.storageId === rec.itemType.storageId))){
             $scope.types.push(rec.itemType);
             }
             })
             */
            $scope.types = $scope.types.concat(records);

            $.each($scope.types, function (ind, rec) {
                rec.id = ++ind;
                rec.state = RecordClientState.Default;
            })

/*
            if ($scope.types.length > 0) {
                $scope.orderTypeId = $scope.types[0].id;
                $scope.onSelectOrderType();
            }
*/

            var rec = getTypeRecordByName($scope.addedTypeName);
            if (rec) {
                rec.state |= RecordClientState.JustAdded;
            }
            rec = getItemRecordByName($scope.addedItemName);
            if (rec) {
                rec.state |= RecordClientState.JustAdded;
            }

            defer.resolve(result);

        }, function (error) {
            defer.reject(error);
            console.log("Error getting DNS records ");
            $scope.error = Errors.CANNOT_GET_TYPE_RECORDS;
            $scope.errorMessage = error && error.message ? error.message : Errors.CANNOT_GET_TYPE_RECORDS;

        })
        return defer.promise;
    };


    $scope.changeTab = function (tab) {

        if ($scope.order.length > 0) {
            clearPrepareOrderPage();
            clearOrderPage();
        }
        $scope.view_tab = tab;
    };

    $scope.onLostEditFocus = function (id) {
        var inputName = "#name" + id;
        $(inputName).prop('disabled', true);
    };


    var getCountryFromAuthUser = function () {
        //return "est";
        return null;
    }

    var restoreOldValues = function (name, id) {
        var inputName = "#" + name + id;
        var oldval = $(inputName).data("oldval");
        return "item." + name + "=unescape('" + escape(oldval) + "')";
    }

    $(document).on('focusin', 'input', function () {
        console.log("Saving value " + $(this).val());
        if ($(this).data('oldval') != null) {
            return;
        }
        $(this).data('oldval', $(this).val());
    })

    $scope.onStopEditRegistrar = function (id) {
        console.log("on escape: " + this);
        var item = getRecord(id)
        if (!item) return;
        item.state = null;
        var inputName = "#registrar" + this.dns.id;
        var oldval = $(inputName).data("oldval")
        $(inputName).val(oldval);
        $(inputName).data('oldval', null);
        $(inputName).blur();
    };

    $scope.onCancelTypeEdit = function (id) {
        console.log("on escape: " + this);
        var item = getTypeRecord(id)
        if (!item) return;
        if (item.state & RecordClientState.New) {
            removeNewTypeRecord();
        } else {
            item.state = RecordClientState.Default;
            onCancelEditTypeField(id, "tname");
        }
    }

    $scope.onCancelItemEdit = function (id, name) {
        console.log("on cancel cert edit: " + id);
        try {
            var item = getItemRecord(id)
            if (!item) {
                return;
            }
            if (item.state & RecordClientState.New) {
                removeNewItemRecord();
            } else {
                item.state = RecordClientState.Default;
                if (name) {
                    eval(restoreOldValues(name, id));
                    onCancelEditItemField(id, name);


                } else {
                    var elem = document.activeElement;
                    if (elem) {
                        onCancelEditItemField(id, "name");
                    } else {
                        eval(restoreOldValues("name", id));
                        eval(restoreOldValues("description", id));

                        onCancelEditItemField(id, "name");
                        onCancelEditItemField(id, "description");
                    }
                }


            }

        } finally {
            restoreCursor();
        }
    }


    /*$scope.getRecords();*/

    $(".panel-top").resizable({
        handleSelector: ".splitter",
        resizeWidth: false
    });

    function dynamicSort(property) {
        var sortOrder = 1;

        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            var result;

            if (!a[property] && !b[property]) {
                result = 0;
            }
            else if (!a[property]) {
                result = -1;
            }
            else if (!b[property])
                result = 1;
            else {
                result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            }

            return result * sortOrder;
        }
    }

    function getItemRecord(id) {
        if (!$scope.items) return null;
        var res = $scope.items.filter(el => el.id == id
    )
        ;
        return res.length > 0 ? res[0] : null;
    }

    var getOrderItemRecord = function (id) {
        if (!$scope.orderItems) return null;
        var res = $scope.orderItems.filter(el => el.id == id
        )
        ;
        return res.length > 0 ? res[0] : null;
    }


    var getBasketItem = function (id) {
        if (!$scope.basket) return null;
        var res = $scope.basket.filter(el => el.id == id
        )
        ;
        return res.length > 0 ? res[0] : null;
    }


    function getTypeRecord(id) {
        if (!$scope.types) return null;
        var res = $scope.types.filter(el => el.id == id
    )
        ;
        return res.length > 0 ? res[0] : null;

    }


    /*
     var getTypeRecord = function (id) {

     var rec = null;
     if (!$scope.types) return null;

     for (var i = 0; i < $scope.types.length; i++) {
     var r = $scope.types[i];
     if (r.id == id) {
     rec = r;
     break;
     }
     }

     return rec;
     }
     */


    function getItemMaxRecordId() {
        var res = 0;
        for (var i = 0; i < $scope.items.length; i++) {
            var rec = $scope.items[i];
            res = Math.max(rec.id, res);
        }
        return res;
    }

    function getTypeMaxRecordId() {
        var res = 0;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            res = Math.max(rec.id, res);
        }
        return res;
    }

    function checkUniqueRecordByName(id, name) {
        var res = true;
        for (var i = 0; i < $scope.dnsRecords.length; i++) {
            var rec = $scope.dnsRecords[i];
            if (id != rec.id && rec.name.toLowerCase() == name.toLowerCase()) {
                res = false;
                break;
            }
        }
        return res;
    }

    function checkUniqueTypeRecordByName(id, name) {
        var res = true;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            if (id != rec.id && rec.name.toLowerCase() == name.toLowerCase()) {
                res = false;
                break;
            }
        }
        return res;
    }

    function doConfirm(msg, yesFn, noFn) {
        var confirmBox = $("#confirmBox");
        confirmBox.find(".message").html(msg);
        confirmBox.find(".yes,.no").unbind().click(function () {
            confirmBox.hide();
        });
        confirmBox.find(".yes").click(yesFn);
        confirmBox.find(".no").click(noFn);
        confirmBox.show();
    }

    function doAlert(msg) {
        var confirmBox = $("#alertBox");
        confirmBox.find(".message").text(msg);
        confirmBox.find(".yes").unbind().click(function () {
            confirmBox.hide();
        });
        confirmBox.show();
    }

    var adjustTypePositionForAddition = function () {

        while ($scope.startTypeIndex < $scope.types.length - $scope.show.typeNumber) {
            $scope.startTypeIndex += $scope.show.typeNumber;
        }
    };

    var adjustItemPositionForAddition = function () {

        while ($scope.startItemIndex < $scope.items.length - $scope.show.itemNumber) {
            $scope.startItemIndex += $scope.show.itemNumber;
        }
    };

    var adjustCertPositionForAddition = function () {

        while ($scope.startCertIndex < $scope.certificates.length - $scope.show.certNumber) {
            $scope.startCertIndex += $scope.show.certNumber;
        }
    };

    var onCancelEditTypeField = function (id, name) {

        var item = getTypeRecord(id)
        if (!item) return;
        var inputName = "#" + name + id;
        var oldval = $(inputName).data("oldval")
        console.log("setting old val to : " + inputName + " : " + oldval);
        $(inputName).blur();
        $(inputName).val(oldval);
        $(inputName).data('oldval', null);
        $(inputName).attr("placeholder", null);
        item.name = oldval;
        item.state = RecordClientState.Default;

    };

    var onCancelEditItemField = function (id, name) {
        var item = getTypeRecord(id)
        if (!item) return;
        var inputName = "#" + name + id;
        var oldval = $(inputName).data("oldval")
        $(inputName).blur();
        $(inputName).val(oldval);
        $(inputName).data('oldval', null);
        $(inputName).attr("placeholder", null);
        item.state = null;

    };


    var setDefaultSort = function () {
        $scope.sortField = defaultDnsSortField;
        $scope.dnsReverseSort = false;
    }


    function statusCtrl($scope, $sce) {
        $scope.html = $sce.trustAsHtml('&#9989;');
    }

    function scrollIntoView(element, container) {
        var containerTop = $(container).scrollTop();
        var containerBottom = containerTop + $(container).height();
        var elemTop = element.offsetTop;
        var elemBottom = elemTop + $(element).height();
        if (elemTop < containerTop) {
            $(container).scrollTop(elemTop);
        } else if (elemBottom > containerBottom) {
            $(container).scrollTop(elemBottom - $(container).height());
        }
    }

    function random(min, max) {
        var rand = min + Math.random() * (max + 1 - min);
        rand = Math.floor(rand);
        return rand;
    };


    var makeHistorySort = function () {

        var name = $scope.historyOrderField;

        if (!name) {
            return;
        }

        try {
            var sortname = $scope.historyReverseSort ? "-" + name : name;
            $scope.dnsHistory.sort(dynamicSort(sortname));

        } catch (e) {
            console.log("sorting error");
        }
    }

    function enableDnsControls(val) {
        enableControlsBySelector("#dns .button_updateall", val);
        enableControlsBySelector("#dns .button_add", val);
        enableControlsBySelector("#dns .button_edit", val);
        enableControlsBySelector("#dns .button_update", val);
        enableControlsBySelector("#dns .button_delete", val);
        enableControlsBySelector("#dns .button_cancel", val);
        enableControlsBySelector("#dns .button_save", val);
    }


    function enableCertControls(val) {

        enableControlsBySelector("#cert .button_add", val);
        enableControlsBySelector("#cert .button_updateall", val);
        enableControlsBySelector("#cert .button_edit", val);
        enableControlsBySelector("#cert .button_update", val);
        enableControlsBySelector("#cert .button_delete", val);
        enableControlsBySelector("#cert .button_cancel", val);
        enableControlsBySelector("#cert .button_save", val);
    }

    function enableControlsBySelector(name, val) {

        var elements = document.querySelectorAll(name);
        if (!elements) return;

        for (var i = 0; i < elements.length; i++) {
            elements[i].disabled = !val;
        }
    }


    var findNewTypeRecordIndex = function () {
        var res = -1;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            if (rec.state & RecordClientState.New) {
                res = i;
                break;
            }
        }
        return res;
    }

    var isAdminUser = function () {

        if (!$scope.authUser) {
            return true;
        }
        if (!$scope.authUser.authorities) {
            return false;
        }
        var admin = $scope.authUser.authorities.filter(function (elem, i, array) {
                return array[i].authority === 'ROLE_ADMIN';
            }
        );
        return admin && admin.length != 0;
    }

    var removeNewTypeRecord = function () {
        var index = findNewTypeRecordIndex();
        if (index >= 0) {
            console.log("removing new item at " + index);
            $scope.types.splice(index, 1);
        }
    }

    var removeNewItemRecord = function () {
        var index = findNewItemRecordIndex();
        if (index >= 0) {
            console.log("removing new item at " + index);
            $scope.items.splice(index, 1);
        }
    }


    var prepareOrderPage = function () {
        if ($scope.view_tab != "orders") return false;
        return !$scope.order || $scope.order.length == 0;
    }

    function checkUniqueTypetRecordByName(id, name) {
        var res = true;
        for (var i = 0; i < $scope.types.length; i++) {
            var rec = $scope.types[i];
            if (id != rec.id && rec.name.toLowerCase() == name.toLowerCase()) {
                res = false;
                break;
            }
        }
        return res;
    }

    function getCertRecord(id) {
        var res = null;
        for (var i = 0; i < $scope.certificates.length; i++) {
            if ($scope.certificates[i].id == id) {
                res = $scope.certificates[i];
                break;
            }
        }
        return res;
    }


    $scope.inputDelay = (function () {
        var promise = null;
        return function (callback, ms) {
            $timeout.cancel(promise); //clearTimeout(timer);
            promise = $timeout(callback, ms); //timer = setTimeout(callback, ms);
        };
    })();

    console.log("getting settings...");
    $scope.getSettings().then(function (res) {

        console.log("getting data...");

        $scope.getData().then(function (res) {

            console.log("Got records : " + res);
            assetsService.getAuthUser().then(function (result) {

                    $scope.authUser = result;
                    console.log("Authenticated user = " + $scope.authUser.username);
                    $scope.country = getCountryFromAuthUser();

                }, function (error) {
                    console.log("Error getting authenticated user");
                }
            );
        });
    });

/*
    $scope.getData().then(function (res) {

        console.log("Got records : " + res);
        assetsService.getAuthUser().then(function (result) {

                $scope.authUser = result;
                console.log("Authenticated user = " + $scope.authUser.username);

            }, function (error) {
                console.log("Error getting authenticated user");
            }
        );
    });
*/

    $("#typerecords tr").click(function () {
        $(this).addClass('selected').siblings().removeClass('selected');
    });

    $scope.onselect = function () {
        console.log("select");

    }

    $scope.chooseCountry = function (id) {
        $scope.country = id;

        setLoading();

        setTimeout(stopLoading, 500);
    }

    $scope.setSelectedItem = function (itemId) {

        $scope.idSelectedItem = itemId;
    }

    $scope.setSelectedType = function (typeId) {

        $scope.idSelectedType = typeId;

        if (!typeId) {
            return;
        }

        var defer = $q.defer();

        $scope.items = [];
        setLoading();
        assetsService.getTypeItems(typeId).then(function (result) {


            var records = result;

            if (!records) {
                console.log("No item records");
            }
            $scope.items = $scope.items.concat(records);

            $.each($scope.items, function (ind, rec) {
                rec.id = ++ind;
                rec.state = RecordClientState.Default;
            })

            defer.resolve(result);
            stopLoading();

        }, function (error) {
            defer.reject(error);
            console.log("Error getting item records ");
            $scope.error = Errors.CANNOT_GET_ITEM_RECORDS;
            $scope.errorMessage = error && error.message ? error.message : Errors.CANNOT_GET_ITEM_RECORDS;
            stopLoading();

        })

    }

    $scope.placeBasketDisabled = function () {

        if ($scope.orderItemId == null) return true;
        var item = getOrderItemRecord($scope.orderItemId);
        if (!item) {
            return true;
        }
        return item.needApprove && !$scope.itemManager;

    }

    $scope.goOrderDisabled = function () {
        if ($scope.basket == null) return true;
        return $scope.basket.length == 0;
    }

    $scope.goOrderShow = function () {
        if (!prepareOrderPage()) return false;
        return $scope.country != null;
    }

    $scope.showApprovalNotification = function () {
        if ($scope.orderItemId == null) return false;
        var item = getOrderItemRecord($scope.orderItemId);
        if (!item) return false;
        return item.needApprove;
    }

    $scope.isCreateOrder = function () {

        if (!$scope.order) return false;
        return ($scope.order.length != 0)
    }

    $scope.onAddToBasket = function () {

        if ($scope.orderItemId == null) return;
        if ($scope.typerecord == null) {
            $scope.typerecord = getTypeRecord($scope.orderTypeId);
        }
        if (!$scope.typerecord) return;

        var item = getOrderItemRecord($scope.orderItemId);
        if (!item) return;

        var basketitem = getBasketItem(item.storageId);

        if (basketitem) {
            basketitem.amount++;
        } else {
            $scope.basket.push({
                typename: $scope.typerecord.name,
                id: item.storageId,
                name: item.name,
                description: item.description,
                manager: $scope.itemManager,
                amount: 1
            })
        }

    }

    $scope.onSelectOrderItem = function () {
        if ($scope.orderItemId == null) return;
        $scope.itemmanager = null;
        $("#itemDesc").html("");
        console.log("item = " + $scope.orderItemId);
        var item = getOrderItemRecord($scope.orderItemId);
        if (!item) return;
        var itemDesc = !item.description ? "" : item.description;
        $("#itemDesc").html(itemDesc);
    }

    $scope.onAddOrderItem = function () {
        console.log("add item = " + $scope.orderItemId);
    }

    $scope.toOrderPage = function () {
        setLoading();
        setTimeout(function () {

            $scope.order = $scope.order.concat($scope.basket);
            clearPrepareOrderPage();

        }, 1000);

        stopLoading();

    }

    $scope.isShowCountries = function () {
        if (!prepareOrderPage()) return false;
        return $scope.country == null;
    }

    $scope.isShowTypes = function () {
        if (!prepareOrderPage()) return false;
        return $scope.country != null;
    }

    $scope.isShowBasket = function () {
        if (!prepareOrderPage()) return false;
        return $scope.basket != null && $scope.basket.length > 0;
    }

    $scope.isShowItems = function () {
        if (!prepareOrderPage()) return false;
        return $scope.country != null && $scope.orderTypeId != null;
    }

    $scope.orderPage = function () {
        if ($scope.view_tab != "orders") return false;
        return $scope.order && $scope.order.length != 0;
    }

    var clearPrepareOrderPage = function () {
        $scope.orderTypeId = null;
        $scope.orderItemId = null;
        $scope.country = null;
        $scope.basket = [];
        $scope.typerecord = null;
        $scope.updateClientRecords();
    }

    var clearOrderPage = function () {
        $scope.order = [];

    }

    $scope.onCreateOrder = function () {
        console.log("create order");
        $scope.order.result = null;
        $scope.createOrder();
    }

    $scope.createOrderDisabled = function () {

        if (!$scope.order || $scope.order.length == 0) return true;

        if ($scope.order.result && $scope.order.result.ticketId != null) return true;

        return false;
    }

    $scope.onSelectOrderType = function () {

        var defer = $q.defer();
        console.log("type = " + $scope.orderTypeId);
        $scope.typerecord = getTypeRecord($scope.orderTypeId);

        $scope.orderItemId = null;
        $scope.orderItems = [];
        $("#itemDesc").html("");

        setLoading();

        assetsService.getTypeItems($scope.typerecord.storageId).then(function (result) {

            var records = result;

            if (!records) {
                console.log("No item records");
            }

            $scope.orderItems = $scope.orderItems.concat(records);

            $.each($scope.orderItems, function (ind, rec) {
                rec.id = ++ind;
            })

            if ($scope.orderItems.length > 0) {
                $scope.orderItemId = $scope.orderItems[0].id;
                $scope.onSelectOrderItem();
            }

            defer.resolve(result);
            stopLoading();

        }, function (error) {
            defer.reject(error);
            console.log("Error getting item records ");
            $scope.error = Errors.CANNOT_GET_ITEM_RECORDS;
            $scope.errorMessage = error && error.message ? error.message : Errors.CANNOT_GET_ITEM_RECORDS;
            stopLoading();
        })

    }

    var buildTicketDescription = function () {

        var res = "";
        if ($scope.order.length == 0) {
            return "";
        }
        $.each($scope.order, function (ind, rec) {

            if (res.length > 0) {
                res += "\n";
            }
            res += rec.typename + " ";
            res += rec.name;
            var dotSize = Math.max(2, 85 - (rec.typename.length + rec.name.length));

            for (var i=0; i<dotSize; i++){
                res +=".";
            }
            res += "(" + rec.amount + ")";

            if (rec.manager) {
                res += ".   Should be approved by " + rec.manager;
            }

        })
        return res;
    }


    $scope.nameStyle = function (rec) {

        var style = null;
        if (rec.state & RecordClientState.JustAdded) {
            style = "color: darkGreen;";
        }

        return style;

    }

    $scope.orderManagers = function () {

        var res = "";
        if (!$scope.order) {
            return null;
        }
        if ($scope.order.length == 0) {
            return null;
        }
        $.each($scope.order, function (ind, rec) {
            if (rec.manager){

                if (res.length > 0) {
                    if (res.indexOf(rec.manager) != -1){
                        return;
                    }
                    res += ", ";
                }
                res += rec.manager;

            }

        })
        return res;
    }

    $scope.createOrder = function () {

        var res;
        var defer = $q.defer();

        var authdata = {
            username: $scope.settings.jiraUsername,
            password: $scope.settings.jiraPassword,
            jiraUri: $scope.settings.jiraUrl
        }

        var orderdata = {
            key: $scope.settings.jiraTicketKey,
            summary: $scope.settings.jiraTicketSummary,
            description: buildTicketDescription(),
            name: $scope.settings.jiraTicketName,
            priority: $scope.settings.jiraTicketPriority,
            managers: $scope.orderManagers()
        };

        setLoading();

        setTimeout(jiraService.createTicket(orderdata).then(function (result) {
            stopLoading();
            $scope.order.result = result;
            $scope.order.result.ticketLink = $scope.settings.jiraUrl + "/browse/" + result.ticketId;
            //restoreCursor();

        }, function (error) {
            //restoreCursor();
            stopLoading();
            defer.reject(error);
            console.log("Jira auhentication error");
            $scope.error = Errors.JIRA_AUTH_ERROR;
            $scope.errorMessage = Errors.JIRA_AUTH_ERROR;

        }), 500);
    }
})
;