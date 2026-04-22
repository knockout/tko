# Coverage-Report
Date: 2026-04-22

File                                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s     
------------------------------------|---------|----------|---------|---------|-----------------------
All files                           |   92.96 |    87.95 |   90.72 |    93.1 |                       
 bind/src                           |    97.1 |       91 |   98.82 |   96.36 |                       
  BindingHandler.ts                 |   93.33 |    83.33 |     100 |      92 | 80,97                 
  BindingResult.ts                  |     100 |      100 |     100 |     100 |                       
  DescendantBindingHandler.ts       |     100 |      100 |     100 |     100 |                       
  LegacyBindingHandler.ts           |   96.22 |    88.57 |    92.3 |   94.87 | 19,110                
  applyBindings.ts                  |   95.47 |    88.59 |     100 |   94.47 | 480,494,497,524-532   
  arrayToDomNodeChildren.ts         |   99.31 |     95.6 |     100 |      99 | 104                   
  bindingContext.ts                 |   98.86 |    96.38 |     100 |   98.48 | 110                   
  bindingEvent.ts                   |     100 |    66.66 |     100 |     100 | 20,29                 
 binding.component/src              |   97.95 |    95.08 |     100 |   97.91 |                       
  componentBinding.ts               |   97.22 |    95.55 |     100 |   97.18 | 49,183                
  slotBinding.ts                    |     100 |    93.75 |     100 |     100 | 32                    
 binding.core/src                   |   93.56 |    87.12 |   85.56 |    94.4 |                       
  attr.ts                           |   94.11 |    88.23 |     100 |   94.11 | 24                    
  checked.ts                        |   98.27 |    96.29 |     100 |   98.27 | 108                   
  click.ts                          |     100 |      100 |     100 |     100 |                       
  css.ts                            |     100 |      100 |     100 |     100 |                       
  descendantsComplete.ts            |   33.33 |        0 |      50 |   33.33 | 8-9                   
  enableDisable.ts                  |     100 |      100 |     100 |     100 |                       
  event.ts                          |     100 |    96.66 |     100 |     100 | 59                    
  hasfocus.ts                       |   93.33 |    88.88 |     100 |   93.33 | 27,68                 
  html.ts                           |     100 |      100 |     100 |     100 |                       
  let.ts                            |     100 |      100 |     100 |     100 |                       
  options.ts                        |   97.33 |    94.59 |     100 |   97.33 | 60,194                
  selectedOptions.ts                |     100 |       90 |     100 |     100 | 38                    
  style.ts                          |   92.85 |    85.71 |     100 |    92.3 | 17                    
  submit.ts                         |    90.9 |    83.33 |     100 |    90.9 | 21                    
  text.ts                           |     100 |      100 |     100 |     100 |                       
  textInput.ts                      |   84.72 |    66.66 |   61.53 |   83.33 | ...12-128,139-140,142 
  uniqueName.ts                     |     100 |       50 |     100 |     100 | 3                     
  using.ts                          |     100 |      100 |     100 |     100 |                       
  value.ts                          |   87.27 |    88.63 |      80 |   92.15 | 30-32,106             
  visible.ts                        |     100 |      100 |     100 |     100 |                       
 binding.foreach/src                |   92.08 |     85.1 |   95.34 |   91.47 |                       
  foreach.ts                        |   92.08 |     85.1 |   95.34 |   91.47 | ...15-421,472,561,575 
 binding.if/src                     |   96.47 |    93.87 |   92.59 |   96.15 |                       
  ConditionalBindingHandler.ts      |   95.65 |      100 |   83.33 |   95.23 | 40,62                 
  else.ts                           |   91.66 |    84.61 |     100 |   91.66 | 36                    
  ifUnless.ts                       |     100 |      100 |     100 |     100 |                       
  with.ts                           |     100 |     87.5 |     100 |     100 | 31                    
 binding.template/src               |   93.17 |    90.45 |    91.3 |   93.17 |                       
  foreach.ts                        |     100 |      100 |     100 |     100 |                       
  nativeTemplateEngine.ts           |      80 |       50 |     100 |      80 | 22-23                 
  templateEngine.ts                 |      75 |       70 |      60 |      75 | 74-78,87,97           
  templateSources.ts                |    90.9 |    90.69 |    87.5 |    90.9 | 94,102-105            
  templating.ts                     |   95.95 |    92.45 |   96.66 |   95.95 | ...38,154,263-264,331 
 builder/src                        |   70.58 |       50 |   33.33 |   70.58 |                       
  Builder.ts                        |   70.58 |       50 |   33.33 |   70.58 | 99-102,301,318-321    
 computed/src                       |   97.16 |    95.56 |   87.09 |   97.16 |                       
  computed.ts                       |   99.13 |    97.32 |   97.29 |   99.13 | 359,484               
  proxy.ts                          |   83.33 |       75 |   63.15 |   83.33 | 69-84                 
  throttleExtender.ts               |     100 |      100 |     100 |     100 |                       
  when.ts                           |     100 |       75 |     100 |     100 | 18                    
 lifecycle/src                      |   93.44 |       86 |     100 |   93.33 |                       
  LifeCycle.ts                      |   93.44 |       86 |     100 |   93.33 | 28,47,100             
 observable/src                     |   96.12 |     92.3 |   94.11 |   96.75 |                       
  Subscription.ts                   |     100 |      100 |     100 |     100 |                       
  defer.ts                          |    92.3 |       75 |     100 |    92.3 | 9                     
  dependencyDetection.ts            |   95.65 |    92.85 |     100 |   95.65 | 36                    
  extenders.ts                      |   95.83 |    88.88 |     100 |   95.83 | 27                    
  mappingHelpers.ts                 |     100 |      100 |     100 |     100 |                       
  observable.ts                     |     100 |    95.83 |     100 |     100 | 165,209               
  observableArray.changeTracking.ts |     100 |    95.16 |     100 |     100 | 53-57,92              
  observableArray.ts                |   94.93 |     92.3 |   95.23 |   94.73 | 205,240,295-296       
  subscribable.ts                   |   87.83 |    83.33 |      80 |    91.3 | 16,189,202-208        
  subscribableSymbol.ts             |     100 |      100 |     100 |     100 |                       
 provider.attr/src                  |   71.42 |       50 |     100 |   69.23 |                       
  AttributeProvider.ts              |   71.42 |       50 |     100 |   69.23 | 20,48,54-59,68-72     
 provider.bindingstring/src         |   97.05 |      100 |   83.33 |   95.23 |                       
  BindingStringProvider.ts          |   97.05 |      100 |   83.33 |   95.23 | 57                    
 provider.component/src             |   91.66 |    90.62 |   91.66 |   91.11 |                       
  ComponentProvider.ts              |   91.66 |    90.62 |   91.66 |   91.11 | 30,43,57,72           
 provider.databind/src              |      75 |       50 |     100 |      75 |                       
  DataBindProvider.ts               |      75 |       50 |     100 |      75 | 18,25                 
 provider.multi/src                 |     100 |    93.75 |     100 |     100 |                       
  MultiProvider.ts                  |     100 |    93.75 |     100 |     100 | 67                    
 provider.mustache/src              |   93.75 |    78.89 |   84.61 |   96.11 |                       
  AttributeMustacheProvider.ts      |   83.92 |    71.11 |   80.76 |   89.74 | 46-49,100             
  TextMustacheProvider.ts           |     100 |    94.44 |     100 |     100 | 36                    
  mustacheParser.ts                 |     100 |    80.43 |   83.33 |     100 | 14-31,42-85           
 provider.native/src                |     100 |    92.85 |     100 |     100 |                       
  NativeProvider.ts                 |     100 |    92.85 |     100 |     100 | 27                    
 provider.virtual/src               |     100 |      100 |     100 |     100 |                       
  VirtualProvider.ts                |     100 |      100 |     100 |     100 |                       
 provider/src                       |   55.35 |    52.17 |   47.82 |   56.09 |                       
  BindingHandlerObject.ts           |     100 |    91.66 |     100 |     100 | 7                     
  Provider.ts                       |   41.86 |    38.23 |   42.85 |   43.75 | ...7,70-82,94,111-143 
 utils.component/src                |   95.36 |    92.22 |   97.56 |   95.33 |                       
  ComponentABC.ts                   |     100 |      100 |     100 |     100 |                       
  loaders.ts                        |   93.25 |    89.47 |   95.65 |   93.18 | ...17,223,251,280,289 
  registry.ts                       |      98 |    96.42 |     100 |      98 | 97                    
 utils.functionrewrite/src          |   88.88 |    83.33 |     100 |   88.88 |                       
  functionRewrite.ts                |   88.88 |    83.33 |     100 |   88.88 | 16                    
 utils.jsx/src                      |   94.27 |    88.88 |   88.75 |   96.15 |                       
  JsxObserver.ts                    |   96.66 |    92.93 |   92.42 |   97.61 | 133,150,220,286       
  jsx.ts                            |    90.9 |    78.57 |   66.66 |   86.66 | 26,52                 
  jsxClean.ts                       |      80 |    68.18 |      75 |      92 | 53-54                 
 utils.parser/src                   |   92.01 |    89.45 |   94.95 |   92.17 |                       
  Arguments.ts                      |     100 |      100 |     100 |     100 |                       
  Expression.ts                     |   83.33 |       50 |     100 |   83.33 | 17                    
  Identifier.ts                     |      92 |    85.41 |     100 |      92 | 115-118,150           
  Node.ts                           |   95.74 |     93.1 |     100 |   95.65 | 26,117                
  Parameters.ts                     |   91.66 |     90.9 |   83.33 |   91.66 | 23,34                 
  Parser.ts                         |   91.27 |       89 |   95.83 |   91.43 | ...71,773,810,825,876 
  Ternary.ts                        |     100 |      100 |     100 |     100 |                       
  identifierExpressions.ts          |     100 |      100 |     100 |     100 |                       
  operators.ts                      |   89.02 |     87.5 |    92.1 |   89.74 | ...-68,95,101-116,142 
  preparse.ts                       |     100 |    94.82 |     100 |     100 | 43,54,93              
 utils/src                          |   89.17 |    84.29 |    90.9 |   89.26 |                       
  array.ts                          |   92.07 |    88.23 |   93.33 |   92.63 | 74,99-105             
  async.ts                          |     100 |      100 |     100 |     100 |                       
  css.ts                            |   88.88 |    83.33 |     100 |   88.88 | 14                    
  error.ts                          |   88.88 |       50 |     100 |   88.88 | 10                    
  memoization.ts                    |   95.55 |     90.9 |     100 |      95 | 18,74                 
  object.ts                         |    97.5 |    88.23 |     100 |    97.5 | 42                    
  options.ts                        |   86.95 |    72.72 |      90 |   86.36 | 63-68,122             
  string.ts                         |     100 |      100 |     100 |     100 |                       
  tasks.ts                          |      70 |       64 |   63.63 |   70.83 | 18-37                 
 utils/src/dom                      |   87.29 |    81.25 |   90.47 |    87.4 |                       
  data.ts                           |   89.28 |    85.71 |     100 |     100 | 45,52,61              
  disposal.ts                       |   87.93 |     77.5 |   81.81 |   87.03 | 74,104,117-123,134    
  event.ts                          |   77.27 |    67.44 |      80 |      75 | ...-64,69,77-78,82-86 
  fixes.ts                          |     100 |      100 |     100 |     100 |                       
  html.ts                           |   70.68 |    77.19 |      75 |   69.09 | ...09,120-121,128,133 
  info.ts                           |    61.9 |       50 |     100 |    61.9 | 16-24,46,54           
  manipulation.ts                   |     100 |    72.72 |     100 |     100 | 26-34,45              
  selectExtensions.ts               |   97.56 |    97.43 |     100 |   97.43 | 39                    
  virtualElements.ts                |   94.16 |    91.11 |   94.11 |   94.73 | 189-198,231           
------------------------------------|---------|----------|---------|---------|-----------------------

=============================== Coverage summary ===============================
Statements   : 92.96% ( 4467/4805 )
Branches     : 87.95% ( 3001/3412 )
Functions    : 90.72% ( 1027/1132 )
Lines        : 93.1% ( 4009/4306 )
================================================================================