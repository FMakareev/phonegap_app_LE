import React, {Component} from 'react';



export class HomePage extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState;
    }

    get initialState() {
        return {}
    }


    render() {
        console.log(this);
        return (
            <div>
                HomePage
            </div>
        )
    }
}

//
// {/*<div>*/}
// {/*<Header/>*/}
// {/*HomePage*/}
// {/*/!*<LanguageSwitcher/>*!/*/}
// {/*</div>*/}