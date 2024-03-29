/*
 * Copyright 2019 The Kubeflow Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Markdown from 'markdown-to-jsx';
import * as React from 'react';
import { classes, cssRaw } from 'typestyle';
import { V2beta1Filter, V2beta1PredicateOperation } from 'src/apisv2beta1/filter';
import { AutoLink } from 'src/atoms/ExternalLink';
import { RoutePageFactory } from 'src/components/Router';
import { ToolbarProps } from 'src/components/Toolbar';
import SAMPLE_CONFIG from 'src/config/sample_config_from_backend.json';
import { commonCss, padding } from 'src/Css';
import { Apis } from 'src/lib/Apis';
import Buttons from 'src/lib/Buttons';
import { Page } from './Page';

const DEMO_PIPELINES: string[] = SAMPLE_CONFIG;
const DEMO_PIPELINES_ID_MAP = {
  control: 1,
  data: 0,
};

const PAGE_CONTENT_MD = ({ control, data }: { control: string; data: string }) => `
<br/>

## Build your own pipeline with

* Kubeflow Pipelines [SDK](https://www.kubeflow.org/docs/pipelines/sdk/v2/)

<br/>

## Demonstrations and Tutorials
This section contains demo and tutorial pipelines.

**Tutorials** - Learn pipeline concepts by following a tutorial.

* [Data passing in Python components](${data}) - Shows how to pass data between Python components. [source code](https://github.com/kubeflow/pipelines/tree/master/samples/tutorials/Data%20passing%20in%20python%20components)
* [DSL - Control structures](${control}) - Shows how to use conditional execution and exit handlers. [source code](https://github.com/kubeflow/pipelines/tree/master/samples/tutorials/DSL%20-%20Control%20structures)

Want to learn more? [Learn from sample and tutorial pipelines.](https://www.kubeflow.org/docs/pipelines/tutorials/)
`;

cssRaw(`
.kfp-start-page li {
  font-size: 14px;
  margin-block-start: 0.83em;
  margin-block-end: 0.83em;
  margin-left: 2em;
}
.kfp-start-page p {
  font-size: 14px;
  margin-block-start: 0.83em;
  margin-block-end: 0.83em;
}
.kfp-start-page h2 {
  font-size: 18px;
  margin-block-start: 1em;
  margin-block-end: 1em;
}
.kfp-start-page h3 {
  font-size: 16px;
  margin-block-start: 1em;
  margin-block-end: 1em;
}
`);

const OPTIONS = {
  overrides: { a: { component: AutoLink } },
  disableParsingRawHTML: true,
};

export class GettingStarted extends Page<{}, { links: string[] }> {
  public state = {
    links: ['', '', '', '', ''].map(getPipelineLink),
  };

  public getInitialToolbarState(): ToolbarProps {
    const buttons = new Buttons(this.props, this.refresh.bind(this));
    return {
      actions: buttons.getToolbarActionMap(),
      breadcrumbs: [],
      pageTitle: 'Getting Started',
    };
  }

  // token size sort filter
  public async componentDidMount() {
    const ids = await Promise.all(
      DEMO_PIPELINES.map(name =>
        Apis.pipelineServiceApiV2
          .listPipelines(undefined, undefined, 10, undefined, createAndEncodeFilter(name))
          .then(pipelineList => {
            const pipelines = pipelineList.pipelines;
            if (pipelines?.length !== 1) {
              // This should be accurate, do not accept ambiguous results.
              return '';
            }
            return pipelines[0].pipeline_id || '';
          })
          .catch(() => ''),
      ),
    );
    this.setState({ links: ids.map(getPipelineLink) });
  }

  public async refresh() {
    this.componentDidMount();
  }

  public render(): JSX.Element {
    return (
      <div className={classes(commonCss.page, padding(20, 'lr'), 'kfp-start-page')}>
        <Markdown options={OPTIONS}>
          {PAGE_CONTENT_MD({
            control: this.state.links[DEMO_PIPELINES_ID_MAP.control],
            data: this.state.links[DEMO_PIPELINES_ID_MAP.data],
          })}
        </Markdown>
      </div>
    );
  }
}

function getPipelineLink(id: string) {
  if (!id) {
    return '#/pipelines';
  }
  return `#${RoutePageFactory.pipelineDetails(id)}`;
}

function createAndEncodeFilter(filterString: string): string {
  const filter: V2beta1Filter = {
    predicates: [
      {
        key: 'name',
        operation: V2beta1PredicateOperation.EQUALS,
        string_value: filterString,
      },
    ],
  };
  return encodeURIComponent(JSON.stringify(filter));
}
