import React, {Component} from 'react';
import {Marker} from "react-google-maps"
import Drawer from 'material-ui/Drawer';
import {connect} from "react-redux";
import CircularProgress from 'material-ui/Progress/CircularProgress';
import {lexicon} from './lexicon';
import {WEBSQL_SEARCH_REMOVE} from "../../store/websql/action_types";
import Error from 'material-ui-icons/Error';
import {TABLE_NAME} from "../../config";
import {MapWithAMarkerClusters} from "./MapWithAMarkerClusters";
import {MAP_CLUSTERING_LOAD} from "../../store/map/action_types";

// https://habrahabr.ru/post/213515/
// https://habrahabr.ru/post/84654/
// https://tomchentw.github.io/react-google-maps/



function mapStateToProps(state) {
    return {
        clustering: state.map.clustering,
        currentLocal: state.intl,
        search_result: state.websql.search_result,
        db: {
            db: state.websql.db.db,
            loading: state.websql.db.loading,
            error: state.websql.db.error,
            success: state.websql.db.success,
        },
        data: {
            loading: state.websql.data.loading,
            error: state.websql.data.error,
            success: state.websql.data.success,
        },
        set: {
            loading: state.websql.set.loading,
            error: state.websql.set.error,
            success: state.websql.set.success,
        },
        version: {
            version: state.websql.version.version,
            loading: state.websql.version.loading,
            error: state.websql.version.error,
            success: state.websql.version.success,
        }
    }
}

function mapDispatchToProps(dispatch) {
    return {
        dispatch: (type, payload) => {
            dispatch({type, payload})
        }
    }
}

@connect(mapStateToProps, mapDispatchToProps)
export class HomePage extends Component {

    static API_KEY = 'AIzaSyApwO-qq_ruPB3MZ8yk1RsAFeucrb0mUX0';
    static DB;

    constructor(props) {
        super(props);
        this.state = this.initialState;
        this.createLoadingPanel = this.createLoadingPanel.bind(this);
        this.renderLoading = this.renderLoading.bind(this);
        this.getMarkers = this.getMarkers.bind(this);
        this.toggleDescription = this.toggleDescription.bind(this);
    }

    get initialState() {
        return {
            bottom: false,
            description: false,
            markers: []
        }
    }

    componentDidMount() {
        // this.createWebSQL();
    }

    componentWillReceiveProps(nextProps) {
        const {db, set, search_result} = nextProps;
        console.log(nextProps);
        if (search_result !== this.props.search_result) {
            console.log(this.props.search_result);
            this.toggleDescription(true, search_result);
            return true
        }
        if (db !== this.props.db.db && set.success) {
            let result = this.getMarkers();
            console.log(result);
        }
    };

    createLoadingPanel() {
        const {db, data, set, version, currentLocal} = this.props;

        if (version.loading) {
            return this.renderLoading(lexicon[currentLocal].loading.version, true)
        } else if (!version.loading && version.error) {
            return this.renderLoading(lexicon[currentLocal].error.version, false)
        }

        if (db.loading) {
            return this.renderLoading(lexicon[currentLocal].loading.db, true)
        } else if (!db.loading && db.error) {
            return this.renderLoading(lexicon[currentLocal].error.db, false)
        }

        if (data.loading) {
            return this.renderLoading(lexicon[currentLocal].loading.data, true)
        } else if (!data.loading && data.error) {
            return this.renderLoading(lexicon[currentLocal].error.data, false)
        }
        if (set.loading) {
            return this.renderLoading(lexicon[currentLocal].loading.set, true)
        } else if (!set.loading && set.error) {
            return this.renderLoading(lexicon[currentLocal].error.set, false)
        }
        return null
    }

    async getMarkers() {
        const {db} = this.props;
        const markers = [];
        if (this.state.markers.length === 0) {
            const data = await new Promise((resolve, reject) => {
                try {
                    ('db' in db) && db.db.transaction((tx) => {
                        let sqlResultSet = tx.executeSql(`SELECT *
                                                          FROM ${TABLE_NAME}`, [],
                            (sqlTransaction, sqlResultSet) => {
                                console.log(sqlTransaction, sqlResultSet);
                                resolve(Object.values(sqlResultSet.rows))
                            }, (sqlTransaction, sqlEerror) => {
                                console.log(sqlTransaction, sqlEerror);
                                reject(sqlEerror);
                            });
                        console.log(sqlResultSet);
                    });
                } catch (err) {
                    console.log(err);
                }
            });

            console.log(data);
            let length = data && data.length ? data.length : 0;

            this.props.dispatch(MAP_CLUSTERING_LOAD, true);

            for (let i = 0; i < length; i++) {
                if (data[i].lng && data[i].lat) {
                    markers.push(<Marker
                        key={i}
                        position={{lat: data[i].lat, lng: data[i].lng}}
                        onClick={() => this.toggleDescription(true, data[i])}
                    />)
                }
            }

            this.setState({markers})
        }
    }

    renderLoading = (content, load) => (<div className="loading-panel_wrapper">
        <div>

            {
                load &&
                <CircularProgress style={{
                    display: 'block',
                    color: '#0277bd',
                    margin: '0 auto'
                }} size={60} thickness={7}/>
            }
            {
                !load &&
                <Error style={{
                    color: '#F44336',
                    display: 'block',
                    width: '60px',
                    height: '60px',
                    margin: '0 auto'
                }}/>
            }
            <div className="loading-panel_content">
                {
                    content
                }
            </div>
        </div>
    </div>);

    toggleDescription(open, data) {
        console.log('openDescription', data);
        const {currentLocal} = this.props;
        if (data) {
            const description = (
                <div className="places-description_wrapper" style={{
                    padding: '0 15px'
                }}>
                    <h3 className="places-description_title">
                        {lexicon[currentLocal].company_desc.company}: {data.company}
                    </h3>
                    <p className="places-description_text">
                        {lexicon[currentLocal].company_desc.license_type}: {data.license_type === 'alcohol' ? lexicon[currentLocal].company_desc.alcohol : lexicon[currentLocal].company_desc.tobacco}
                        <br/>
                        {lexicon[currentLocal].company_desc.license_number}: {data.license} <br/>
                        {lexicon[currentLocal].company_desc.license_start_at}/{lexicon[currentLocal].company_desc.license_end_at}: {data.license_start_at}
                        — {data.license_end_at}
                    </p>
                </div>
            );
            this.setState({
                'bottom': open,
                description
            });
        } else {
            this.setState({
                'bottom': open,
                description: null
            });
            if (this.props.search_result) {
                this.props.dispatch(WEBSQL_SEARCH_REMOVE, null)
            }
        }

    }


    render() {
        const {db, data, set, version, currentLocal} = this.props;
        console.log('Home page index', this.props);
        if (this.createLoadingPanel()) {
            return this.createLoadingPanel()
        }
        if (version.error) {
            return (<div>{lexicon[currentLocal].error.version}</div>)
        } else if (db.error) {
            return (<div>{lexicon[currentLocal].error.db}</div>)
        } else if (data.error) {
            return (<div>{lexicon[currentLocal].error.data}</div>)
        } else if (set.error) {
            return (<div>{lexicon[currentLocal].error.set}</div>)
        }
        return (
            <div>

                <MapWithAMarkerClusters

                    clusteringStatus={this.props.clustering}

                    dispatch={this.props.dispatch}

                    center={{
                        lat: this.props.search_result ? this.props.search_result.lat : 46.484583,
                        lng: this.props.search_result ? this.props.search_result.lng : 30.7326,
                    }}

                    zoom={this.props.search_result ? 14 : 10}

                    toggleDescription={this.toggleDescription} markers={this.state.markers}/>

                <Drawer
                    onClick={() => this.toggleDescription(false, null)}
                    onKeyDown={() => this.toggleDescription(false, null)}
                    anchor="bottom"
                    open={this.state.bottom}
                    onClose={() => this.toggleDescription(false, null)}
                >
                    {this.state.description}
                </Drawer>
                {
                    this.props.clustering &&
                    <div className="loading-panel_wrapper">
                        <div>
                            <CircularProgress style={{
                                display: 'block',
                                color: '#0277bd',
                                margin: '0 auto'
                            }} size={60} thickness={7}/>
                            <div className="loading-panel_content">
                                Загрузка карты...
                            </div>
                        </div>
                    </div>
                }

            </div>
        )
    }
}