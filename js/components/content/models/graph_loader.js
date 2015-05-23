module.exports = function GraphLoader () {
    GraphLoader.prototype.exportToFile = function (model) {
        console.log(JSON.stringify(model));
        var jsonData = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(model));
        var a = document.createElement('a');
        a.href = jsonData;
        a.target = '_blank';
        a.download = 'pt.json';
        document.body.appendChild(a);
        a.click();
    };
    GraphLoader.prototype.importFromFile = function (readCallBack) {
        try {
            var f = document.getElementById('file-input').files[0];
        } catch (err) {
            alert('Please choose a file first');
        }
        if (f) {
            var r = new FileReader();
            var read;
            var _this = this;
            r.onload = readCallBack;
            r.readAsText(f);
        }

    }
};