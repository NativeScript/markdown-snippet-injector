# Welcome to `markdown-snippet-injector`
A tool for injecting code snippets into MarkDown files:

1. Define snippets in your source by using a simple notation
2. Put placeholders associated with the snippets in your MarkDown files
3. Run MarkDown injector to replace the placeholders during your documentation build:

`mdinject --root=<path-to-source-code> --docsroot=<path-to-docs>`

# Using `markdown-snippet-injector`

## Defining snippets in `JavaScript` and `TypeScript` source files

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

## Defining source snippets in `XML` files
If you want to define a code-snippet in a `XML` file you should use the following approach:

```XML
<!-- >> listview-first-look -->
<navigation:ExamplePage xmlns:navigation="navigation/example-page" loaded="onPageLoaded" xmlns:lv="nativescript-telerik-ui/listview" xmlns="http://www.nativescript.org/tns.xsd">
    <lv:RadListView items="{{ dataItems }}" >
        <lv:RadListView.listViewLayout>
            <lv:ListViewLinearLayout scrollDirection="Vertical"/>
        </lv:RadListView.listViewLayout>
        <lv:RadListView.itemTemplate>
            <StackLayout orientation="vertical">
                <Label fontSize="20" text="{{ itemName }}"/>
                <Label fontSize="14" text="{{ itemDescription }}"/>
            </StackLayout>
        </lv:RadListView.itemTemplate>
    </lv:RadListView>
</navigation:ExamplePage>
<!-- << listview-first-look -->
```

## Defining source snippets in `CSS` files
Code snippets inside CSS files are defined as follows:

``` CSS
/* >> css-snippet */
.btn {
    color: green;
    text-align: center;
}
/* << css-snippet */
```

## Defining placeholders for the snippets in your `MarkDown` files
Use the `<snippet id='<your-snippet-id>'/>` notation to define the corresponding placeholders in your markdown files. They will be replaced by the snippet injector when run:

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

## Defining file extension filters
You can choose what kind of files will be processed during snippet injection by using the `--sourceext` and `--targetext` parameters. The default values of these properties are `.ts` and `.md` respectively.

### Multiple source and target extension types
You can define multiple source or target extension types by setting the corresponding parameters to a set of extensions separated by a `|`:
```
mdinject --root=. --docsroot=../ --sourceext=".ts|.js" --targetext=".md|.txt"
```
In this way all target files will be processed and the corresponding snippet placeholders will be replaced.

## Defining a title for the injected snippet
When injected, a snippet is formatted using the default MarkDown code-snippet format. You can append a title to the injected snippet by using the `--snippettitles` parameter. By default, `.js` and `.ts` files are recognized and the snippets coming from them are titled `JavaScript` or `TypeScript`. You can define custom snippet titles by setting the `--snippettitles` parameter to a set of titles separated by a `|`:
```
mdinject --root=. --docsroot=../ --sourceext=".java|.cs" --targetext=".md|.txt" --snippettitles="Java|C#"
```
> Note that the order of the snippet titles must be the related to the order of the source extension types so that they match.
