# Welcome to `markdown-snippet-injector`
A tool for injecting code snippets into MarkDown files.

- Define snippets in your source by using a simple notation
- Put placeholders associated with the snippets in your MarkDown files
- Run MarkDown injector to replace the placeholders during your documentation build

# Using `markdown-snippet-injector`
Defining code snippets in your source files is done by enclosing them as shown below:

```
// >> sum-snippet
export function sum(a, b){
    return a + b;
}
// << sum-snippet

// >> multiplication-snippet
export function multiply(a, b){
    return a * b;
}
// << multiplication-snippet

// >> division-snippet
export function divide(a, b){
    return a / b;
}
// << division-snippet
```

Then use the `<snippet id='<your-snippet-id'/>` notation to define the corresponding placeholders in your markdown files. They will be replaced by the snippet injector when run:

```MarkDown
    # Using the multiply function:
        <snippet id='multiplication-snippet'/>
    # Using the sum function:
        <snippet id='sum-snippet'/>
```

# Advanced features
## Nested snippets
Nested snippets are also supported. This is helpful in scenarios where you want to explain parts of a larger snippet in steps:

```
// >> view-model-snippet
export class ViewModel {

    private _items: ObservableArray<DataItem>;

    constructor() {
        this.initDataItems();
    }

    get dataItems() {
        return this._items;
    }
// >> handling-event-snippet
    public onShouldRefreshOnPull(args: listViewModule.ListViewEventData) {
        var that = new WeakRef(this);
        console.log("Event fired");
        timer.setTimeout(function() {
            for (var i = 0; i < 25; i++) {
                that.get()._items.splice(0, 0, new DataItem(that.get()._items.length, "Item " + that.get()._items.length, "This is item description."));

            }
            var listView = args.object;
            listView.notifyPullToRefreshFinished();
        }, 1000);

    }    
// << handling-event-snippet

    private initDataItems() {
        this._items = new ObservableArray<DataItem>();

        for (var i = 0; i < 25; i++) {
            this._items.push(new DataItem(i, "Item " + i, "This is item description."));
        }
    }
}

export class DataItem {
    public id: number;
    public itemName;
    public itemDescription;

    constructor(id: number, name: string, description: string) {
        this.id = id;
        this.itemName = name;
        this.itemDescription = description;
    }
}
// << view-model-snippet
```
This will produce two code snippets: one containing the whole view-model class and the other containing the `onShouldRefreshOnPull` function.

## Defining
