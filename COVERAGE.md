# Coverage-Report
Date: 2026-01-10

File                                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s  
--------------------------------------|---------|----------|---------|---------|--------------------
All files                             |   89.73 |    83.31 |   86.25 |   89.77 |                    
 builds/reference/src                 |   71.42 |      100 |       0 |     100 |                    
  index.ts                            |   71.42 |      100 |       0 |     100 |                    
 packages/bind/dist                   |   96.37 |    90.78 |   96.55 |   96.27 |                    
  BindingHandler.js                   |   93.33 |       75 |   84.61 |    93.1 | 32,47              
  BindingResult.js                    |     100 |      100 |     100 |     100 |                    
  DescendantBindingHandler.js         |     100 |      100 |     100 |     100 |                    
  LegacyBindingHandler.js             |   95.12 |    88.88 |    92.3 |   95.12 | 9,89               
  applyBindings.js                    |   94.11 |     87.5 |     100 |   93.95 | ...316,319,336-343 
  arrayToDomNodeChildren.js           |   99.08 |     97.5 |     100 |   99.01 | 51                 
  bindingContext.js                   |   98.52 |    93.18 |     100 |   98.52 | 26                 
  bindingEvent.js                     |     100 |      100 |     100 |     100 |                    
 packages/bind/src                    |   26.74 |     2.27 |   23.52 |   26.74 |                    
  BindingHandler.ts                   |      60 |        0 |   44.44 |      60 | 67-71,80,93-101    
  LegacyBindingHandler.ts             |     100 |       50 |     100 |     100 | 12                 
  arrayToDomNodeChildren.ts           |     100 |      100 |     100 |     100 |                    
  bindingContext.ts                   |    8.33 |        0 |       0 |    8.33 | 75-158,166-231     
  bindingEvent.ts                     |     100 |      100 |     100 |     100 |                    
 packages/binding.component/dist      |   97.93 |    92.85 |     100 |   97.84 |                    
  componentBinding.js                 |    97.1 |    93.33 |     100 |   97.01 | 19,120             
  index.js                            |     100 |      100 |     100 |     100 |                    
  slotBinding.js                      |     100 |    91.66 |     100 |     100 | 11                 
 packages/binding.core/dist           |   93.17 |    87.19 |   88.09 |   93.73 |                    
  attr.js                             |   94.73 |     87.5 |     100 |   94.73 | 15                 
  checked.js                          |   98.33 |    97.77 |     100 |   98.11 | 72                 
  click.js                            |     100 |      100 |     100 |     100 |                    
  css.js                              |     100 |      100 |     100 |     100 |                    
  descendantsComplete.js              |      50 |        0 |      50 |      50 | 6-7                
  enableDisable.js                    |     100 |      100 |     100 |     100 |                    
  event.js                            |     100 |      100 |     100 |     100 |                    
  hasfocus.js                         |   93.75 |    92.85 |     100 |   93.75 | 17,44              
  html.js                             |     100 |      100 |     100 |     100 |                    
  index.js                            |     100 |      100 |     100 |     100 |                    
  let.js                              |     100 |      100 |     100 |     100 |                    
  options.js                          |    97.4 |    93.54 |     100 |   97.14 | 42,140             
  selectedOptions.js                  |     100 |      100 |     100 |     100 |                    
  style.js                            |   93.75 |    83.33 |     100 |   93.33 | 14                 
  submit.js                           |   83.33 |       50 |     100 |   83.33 | 7,19               
  text.js                             |     100 |      100 |     100 |     100 |                    
  textInput.js                        |   79.03 |    58.69 |   53.84 |   80.32 | ...0,85,90,108-112 
  uniqueName.js                       |     100 |      100 |     100 |     100 |                    
  using.js                            |     100 |      100 |     100 |     100 |                    
  value.js                            |   87.93 |    86.84 |      80 |   92.59 | 19-21,70           
  visible.js                          |     100 |      100 |     100 |     100 |                    
 packages/binding.foreach/dist        |   92.18 |    86.08 |   93.02 |   91.59 |                    
  foreach.js                          |   92.11 |    86.08 |   93.02 |   91.51 | ...290,332,404,416 
  index.js                            |     100 |      100 |     100 |     100 |                    
 packages/binding.if/dist             |   96.73 |    92.68 |   92.59 |   96.47 |                    
  ConditionalBindingHandler.js        |   95.83 |      100 |   83.33 |   95.45 | 8,25               
  else.js                             |    92.3 |       80 |     100 |    92.3 | 26                 
  ifUnless.js                         |     100 |      100 |     100 |     100 |                    
  index.js                            |     100 |      100 |     100 |     100 |                    
  with.js                             |     100 |    85.71 |     100 |     100 | 18                 
 packages/binding.template/dist       |    93.3 |    89.52 |    91.3 |    93.2 |                    
  foreach.js                          |     100 |      100 |     100 |     100 |                    
  index.js                            |     100 |      100 |     100 |     100 |                    
  nativeTemplateEngine.js             |      80 |       50 |     100 |      80 | 15-16              
  templateEngine.js                   |      75 |    66.66 |      60 |      75 | 9-12,19,27         
  templateSources.js                  |    91.3 |       90 |    87.5 |   90.47 | 32,39-42           
  templating.js                       |   95.97 |    91.85 |   96.66 |   95.97 | ...111,179-180,236 
 packages/binding.template/helpers    |   77.55 |    65.62 |      70 |   78.26 |                    
  dummyTemplateEngine.ts              |   77.55 |    65.62 |      70 |   78.26 | ...39,73,97-99,102 
 packages/builder/dist                |   72.22 |       50 |   33.33 |   72.22 |                    
  Builder.js                          |   72.22 |       50 |   33.33 |   72.22 | 85-88,186,201-204  
 packages/computed/dist               |   96.53 |    96.22 |   85.48 |    96.4 |                    
  computed.js                         |   99.14 |    98.62 |   97.29 |    99.1 | 244,327            
  proxy.js                            |   78.37 |    72.72 |   57.89 |   78.37 | 47-48,58-73        
  throttleExtender.js                 |     100 |      100 |     100 |     100 |                    
  when.js                             |     100 |    66.66 |     100 |     100 | 17                 
 packages/filter.punches/dist         |   96.42 |      100 |    87.5 |   96.15 |                    
  index.js                            |   96.42 |      100 |    87.5 |   96.15 | 55                 
 packages/lifecycle/dist              |   79.59 |       68 |    90.9 |   78.72 |                    
  LifeCycle.js                        |   79.59 |       68 |    90.9 |   78.72 | ...,37,41,69-70,88 
 packages/lifecycle/src               |   91.66 |       68 |    90.9 |   93.47 |                    
  LifeCycle.ts                        |   91.66 |       68 |    90.9 |   93.47 | 29,48,101          
 packages/observable/dist             |   96.39 |    92.99 |   93.04 |   96.78 |                    
  Subscription.js                     |   88.23 |      100 |   66.66 |    87.5 | 25-28              
  defer.js                            |   93.33 |       50 |     100 |   93.33 | 6                  
  dependencyDetection.js              |   96.42 |    88.88 |     100 |      96 | 20                 
  extenders.js                        |   96.55 |    93.75 |     100 |   96.29 | 18                 
  index.js                            |     100 |      100 |     100 |     100 |                    
  mappingHelpers.js                   |     100 |      100 |     100 |     100 |                    
  observable.js                       |     100 |    94.87 |     100 |     100 | 67,94              
  observableArray.changeTracking.js   |     100 |      100 |     100 |     100 |                    
  observableArray.js                  |   95.18 |       90 |   95.45 |      95 | 57,84,124-125      
  subscribable.js                     |   90.58 |    83.72 |   80.76 |   93.42 | 107,119-124        
  subscribableSymbol.js               |     100 |      100 |     100 |     100 |                    
 packages/provider.attr/dist          |   68.96 |       25 |     100 |   66.66 |                    
  AttributeProvider.js                |   68.96 |       25 |     100 |   66.66 | ...,39-44,47,52-55 
 packages/provider.bindingstring/dist |   96.55 |      100 |    87.5 |   96.29 |                    
  BindingStringProvider.js            |   96.29 |      100 |   85.71 |      96 | 44                 
  index.js                            |     100 |      100 |     100 |     100 |                    
 packages/provider.bindingstring/src  |   60.86 |       50 |   66.66 |   63.63 |                    
  BindingStringProvider.ts            |   60.86 |       50 |   66.66 |   63.63 | 22-26,29,50,57     
 packages/provider.component/dist     |   91.83 |    86.95 |   91.66 |    91.3 |                    
  ComponentProvider.js                |   91.83 |    86.95 |   91.66 |    91.3 | 24,34,46,60        
 packages/provider.databind/dist      |   85.71 |      100 |     100 |   84.61 |                    
  DataBindProvider.js                 |   83.33 |      100 |     100 |   81.81 | 15,21              
  index.js                            |     100 |      100 |     100 |     100 |                    
 packages/provider.multi/dist         |     100 |     92.3 |     100 |     100 |                    
  MultiProvider.js                    |     100 |     92.3 |     100 |     100 | 54                 
 packages/provider.mustache/dist      |   51.81 |    43.85 |   46.15 |   52.83 |                    
  AttributeMustacheProvider.js        |   14.63 |       28 |   15.38 |   15.78 | 17-73              
  TextMustacheProvider.js             |   90.47 |    77.77 |     100 |      90 | 14,23              
  mustacheParser.js                   |   66.66 |    47.82 |   66.66 |   66.66 | ...,53-56,62-65,72 
 packages/provider.mustache/src       |   96.36 |    87.71 |   96.15 |   96.29 |                    
  AttributeMustacheProvider.ts        |   90.24 |       84 |    92.3 |      90 | 46-49,100          
  TextMustacheProvider.ts             |     100 |      100 |     100 |     100 |                    
  mustacheParser.ts                   |     100 |    86.95 |     100 |     100 | 14-25,95           
 packages/provider.native/dist        |     100 |    91.66 |     100 |     100 |                    
  NativeProvider.js                   |     100 |    91.66 |     100 |     100 | 17                 
 packages/provider.virtual/dist       |     100 |    72.72 |     100 |     100 |                    
  VirtualProvider.js                  |     100 |    72.72 |     100 |     100 | 20-24              
 packages/provider/dist               |   59.32 |       50 |   51.85 |   58.49 |                    
  BindingHandlerObject.js             |   84.61 |       60 |     100 |   83.33 | 10,18              
  Provider.js                         |   48.83 |    47.82 |   43.47 |   47.36 | ...48-59,69,77-100 
  index.js                            |     100 |      100 |     100 |     100 |                    
 packages/provider/src                |   19.14 |    32.14 |    8.33 |   20.45 |                    
  BindingHandlerObject.ts             |      10 |        0 |       0 |      10 | 5-27               
  Provider.ts                         |   21.62 |    39.13 |    9.09 |   23.52 | 27,38-96,111-143   
 packages/utils.component/dist        |   95.45 |     92.4 |   97.67 |    95.3 |                    
  ComponentABC.js                     |     100 |      100 |     100 |     100 |                    
  index.js                            |     100 |      100 |     100 |     100 |                    
  loaders.js                          |   93.25 |    90.38 |   95.65 |   93.02 | ...110,130,152,160 
  registry.js                         |      98 |       96 |     100 |   97.91 | 62                 
 packages/utils.functionrewrite/dist  |   88.88 |       75 |     100 |   88.88 |                    
  functionRewrite.js                  |   88.88 |       75 |     100 |   88.88 | 11                 
 packages/utils.jsx/dist              |   82.12 |    72.95 |   74.41 |   84.26 |                    
  JsxObserver.js                      |   83.24 |    74.07 |   75.67 |   85.79 | ...287,303,351-352 
  jsx.js                              |   86.66 |    54.54 |   66.66 |   86.66 | 11,28              
  jsxClean.js                         |   61.53 |      100 |   66.66 |   61.53 | 18-23              
 packages/utils.jsx/src               |   96.35 |    89.18 |    92.5 |   97.26 |                    
  JsxObserver.ts                      |   96.08 |    88.88 |   91.89 |   97.05 | ...133,150,220,286 
  jsxClean.ts                         |     100 |      100 |     100 |     100 |                    
 packages/utils.parser/dist           |   92.42 |    88.35 |   89.23 |    92.4 |                    
  Arguments.js                        |     100 |      100 |     100 |     100 |                    
  Expression.js                       |      90 |        0 |     100 |   88.88 | 14                 
  Identifier.js                       |    93.1 |    86.04 |     100 |   92.98 | 93-96,115          
  Node.js                             |   96.29 |     91.3 |     100 |   96.07 | 17,91              
  Parameters.js                       |   94.11 |       90 |   85.71 |   93.54 | 21,31              
  Parser.js                           |    91.5 |    87.81 |   95.91 |   91.62 | ...636,668,679,723 
  Ternary.js                          |     100 |      100 |     100 |     100 |                    
  identifierExpressions.js            |     100 |      100 |     100 |     100 |                    
  index.js                            |    90.9 |        0 |     100 |    90.9 | 13                 
  operators.js                        |   87.17 |       75 |   71.05 |   87.67 | ...66,76,86-89,115 
  preparse.js                         |     100 |      100 |     100 |     100 |                    
 packages/utils/dist                  |   90.95 |    81.98 |   91.95 |      90 |                    
  array.js                            |   92.38 |    88.31 |   93.75 |   92.04 | 50,71-77           
  async.js                            |     100 |      100 |     100 |     100 |                    
  css.js                              |   61.11 |    44.44 |   66.66 |   56.25 | 15-26              
  error.js                            |    90.9 |        0 |     100 |    90.9 | 6                  
  function.js                         |   88.88 |      100 |      75 |    87.5 | 9                  
  index.js                            |     100 |      100 |     100 |     100 |                    
  memoization.js                      |   95.83 |    85.71 |     100 |   95.23 | 13,65              
  object.js                           |   97.56 |    95.45 |     100 |   97.56 | 32                 
  options.js                          |   86.95 |     62.5 |   88.88 |   85.36 | 60-65,85           
  string.js                           |   45.45 |    45.45 |      75 |   45.45 | 9,14-20            
  symbol.js                           |     100 |       50 |     100 |     100 | 5                  
  tasks.js                            |   95.91 |    93.33 |      90 |   94.73 | 15-16              
 packages/utils/dist/dom              |   88.57 |    80.68 |      92 |   88.04 |                    
  data.js                             |   90.62 |       80 |     100 |     100 | 29,34,45           
  disposal.js                         |   89.39 |       80 |   83.33 |   87.93 | 58,82,91-96,102    
  event.js                            |   80.85 |    57.57 |   83.33 |    77.5 | ...-46,50,54,78-83 
  fixes.js                            |     100 |      100 |     100 |     100 |                    
  html.js                             |   74.24 |    77.77 |      80 |   71.66 | ...,61,65-66,72,76 
  info.js                             |   65.21 |       50 |     100 |   65.21 | 14-21,36,43        
  manipulation.js                     |     100 |    81.81 |     100 |     100 | 18,36              
  selectExtensions.js                 |   97.82 |    96.96 |     100 |   97.61 | 30                 
  virtualElements.js                  |   93.98 |    91.78 |   94.73 |   94.06 | 143-149,178-179    
 packages/utils/helpers               |      90 |    69.44 |   94.28 |   89.43 |                    
  jasmine-13-helper.ts                |      90 |    69.44 |   94.28 |   89.43 | ...165,177,231,256 

